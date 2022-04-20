import * as webln from "webln/lib/provider";

type RequestInvoiceArgs = {
  amount?: string | number;
  defaultAmount?: string | number;
  minimumAmount?: string | number;
  maximumAmount?: string | number;
  defaultMemo?: string;
};

type EnableResult = {
  enabled: boolean;
};

export default class WebLNProvider implements webln.WebLNProvider {
  enabled: boolean;
  isEnabled: boolean;
  executing: boolean;

  constructor() {
    this.enabled = false;
    this.isEnabled = false; // seems some webln implementations use webln.isEnabled and some use webln.enabled
    this.executing = false;
  }

  enable(): Promise<void> {
    if (this.enabled) {
      return Promise.resolve();
    }
    return this.execute<EnableResult>("enable").then((result) => {
      if (typeof result.enabled === "boolean") {
        this.enabled = result.enabled;
        this.isEnabled = result.enabled;
      }
    });
  }

  getInfo() {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling getInfo");
    }
    return this.execute<webln.GetInfoResponse>("getInfo");
  }

  getTransactions() {
    if (!this.enabled) {
      throw new Error(
        "Provider must be enabled before calling getTransactions"
      );
    }
    return this.execute("getTransactions");
  }

  lnurl(lnurlEncoded: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling lnurl");
    }
    return this.execute("lnurl", { lnurlEncoded });
  }

  sendPayment(paymentRequest: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling sendPayment");
    }
    return this.execute<webln.SendPaymentResponse>("sendPaymentOrPrompt", {
      paymentRequest,
    });
  }

  keysend(args: webln.KeysendArgs) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling keysend");
    }
    return this.execute<webln.SendPaymentResponse, webln.KeysendArgs>(
      "keysendOrPrompt",
      args
    );
  }

  makeInvoice(args: string | number | RequestInvoiceArgs) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling makeInvoice");
    }
    if (typeof args !== "object") {
      args = { amount: args };
    }

    return this.execute<webln.RequestInvoiceResponse>("makeInvoice", args);
  }

  signMessage(message: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling signMessage");
    }

    return this.execute<webln.SignMessageResponse>("signMessageOrPrompt", {
      message,
    });
  }

  verifyMessage(signature: string, message: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling verifyMessage");
    }

    return this.execute<void>("verifyMessage", { signature, message });
  }

  // NOTE: new call `type`s must be specified also in the content script
  execute<TResult, TArgs = Record<string, unknown>>(
    type: string,
    args?: TArgs
  ): Promise<TResult> {
    return new Promise((resolve, reject) => {
      // post the request to the content script. from there it gets passed to the background script and back
      // in page script can not directly connect to the background script
      window.postMessage(
        {
          application: "LBE",
          prompt: true,
          //action: `webln/${type}`, // TODO: think about a convention to call the actions
          type: `${type}`,
          args,
        },
        "*" // TODO use origin
      );

      function handleWindowMessage(messageEvent: MessageEvent) {
        // check if it is a relevant message
        // there are some other events happening
        if (
          !messageEvent.data ||
          !messageEvent.data.response ||
          messageEvent.data.application !== "LBE"
        ) {
          return;
        }
        if (messageEvent.data.data.error) {
          reject(new Error(messageEvent.data.data.error));
        } else {
          // 1. data: the message data
          // 2. data: the data passed as data to the message
          // 3. data: the actual response data
          resolve(messageEvent.data.data.data);
        }
        // For some reason must happen only at the end of this function
        window.removeEventListener("message", handleWindowMessage);
      }

      window.addEventListener("message", handleWindowMessage);
    });
  }
}
