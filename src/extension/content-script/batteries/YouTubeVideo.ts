import axios from "axios";
import lnurlLib from "~/common/lib/lnurl";
import WebLNProvider from "~/extension/ln/webln";
import getOriginData from "../originData";
import { findLnurlFromYouTubeAboutPage } from "./YouTubeChannel";
import { findLightningAddressInText, setLightningData } from "./helpers";
import { BoostButton } from "~/extension/inpage-components/dist/components";
import { VideoOverlay } from "~/extension/inpage-components/dist/components";

const urlMatcher = /^https:\/\/www\.youtube.com\/watch.*/;

const albySendPayment = async ({
  lnurl,
  amount,
  comment,
}: {
  lnurl: string;
  amount: number;
  comment?: string;
}) => {
  console.log("OK");
  const webln = new WebLNProvider();
  const lnurlDetails = await lnurlLib.getDetails(lnurl); // throws if invalid.

  const params = {
    amount: amount * 1000, // user specified sum in MilliSatoshi
    comment, // https://github.com/fiatjaf/lnurl-rfc/blob/luds/12.md
    // payerdata, // https://github.com/fiatjaf/lnurl-rfc/blob/luds/18.md
  };

  // with lnurl do handshake
  // check error/try/catch
  const response = await axios.get(lnurlDetails.callback, {
    params,
    // https://github.com/fiatjaf/lnurl-rfc/blob/luds/01.md#http-status-codes-and-content-type
    validateStatus: () => true,
  });

  try {
    await webln.enable();
    const result = await webln.sendPayment(response.data.pr);
    console.log({ result });
    console.log("💸", `Sent payment of ${amount*1000}.`)
    // confetti or something similar
  } catch (error) {
    console.info("⛔ error", error);
  }
};

let streamInterval: NodeJS.Timer;

const startPaymentStream = ({
  lnurl,
  amount,
  comment,
}: {
  lnurl: string;
  amount: number;
  comment?: string;
}) => {
  console.log("▶️", "startPaymentStream()");
  
  streamInterval = setInterval(async () => {
    await albySendPayment({ lnurl, amount, comment });
  }, 60*1000);
};

const stopPaymentStream = () => {
  console.log("⏹️", "stopPaymentStream()");

  clearInterval(streamInterval);
};

const createBoostButton = (lnurl: string) => {
  
  var button = document.createElement('boost-button') as unknown as BoostButton;
  button.sendPaymentFunc = albySendPayment;
  document.body.appendChild(button as unknown as HTMLElement);
};

const battery = async (): Promise<void> => {
  let text = "";
  document
    .querySelectorAll(
      "#columns #primary #primary-inner #meta-contents #description .content"
    )
    .forEach((e) => {
      text += ` ${e.textContent}`;
    });
  const channelLink = document.querySelector<HTMLAnchorElement>(
    "#columns #primary #primary-inner #meta-contents .ytd-channel-name a"
  );
  if (!text || !channelLink) {
    return;
  }
  let match;
  let lnurl: string;
  // check for an lnurl
  if ((match = text.match(/(lnurlp:)(\S+)/i))) {
    lnurl = match[2];
  }
  // if there is no lnurl we check for a zap emoji with a lightning address
  // we check for the @-sign to try to limit the possibility to match some invalid text (e.g. random emoji usage)
  else if ((match = findLightningAddressInText(text))) {
    lnurl = match;
  } else {
    // load the about page to check for a lightning address
    const match = channelLink.href.match(
      /^https:\/\/www\.youtube.com\/(channel|c)\/([^/]+).*/
    );
    if (match) {
      lnurl = await findLnurlFromYouTubeAboutPage(match[1], match[2]);
    }
  }

  if (!lnurl) return;

  createBoostButton(lnurl);

  const videoElement = document.querySelector<HTMLVideoElement>(
    "#movie_player .html5-video-container video.html5-main-video"
  );

  if(videoElement) {

    var video = document.createElement('video-overlay') as unknown as VideoOverlay;
    video.videoElement = videoElement;
    document.body.appendChild(video as unknown as HTMLElement);

    videoElement.onplay = async function (e) {
      console.log("▶️ video.onplay()");
      await startPaymentStream({
        lnurl,
        amount: 1,
        comment: "player trggerd",
      });
    };
  
    videoElement.onpause = function (e) {
      console.log("⏸️ video.onpause()");
      stopPaymentStream();
    };
  }

  const name = channelLink.textContent || "";
  const imageUrl =
    document.querySelector<HTMLImageElement>(
      "#columns #primary #primary-inner #meta-contents img"
    )?.src || "";
  setLightningData([
    {
      method: "lnurl",
      address: lnurl,
      ...getOriginData(),
      name,
      description: "", // we can not reliably find a description (the meta tag might be of a different video)
      icon: imageUrl,
    },
  ]);
};

const YouTubeVideo = {
  urlMatcher,
  battery,
};

export default YouTubeVideo;
