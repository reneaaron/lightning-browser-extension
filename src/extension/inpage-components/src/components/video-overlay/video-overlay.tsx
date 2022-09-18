import { Component, Host, h, Method } from '@stencil/core';

@Component({
  tag: 'video-overlay',
  styleUrl: 'video-overlay.css',
  shadow: true,
})
export class VideoOverlay {

  public videoElement: HTMLVideoElement;

  getPosition()  {
    console.log("getPosition()", this.videoElement?.getBoundingClientRect());
    var clientRect = this.videoElement?.getBoundingClientRect();
    if(clientRect) {
      this
      console.log({
        "top": clientRect.top + "px",
        "right": clientRect.left + clientRect.width + "px",
      });
      return {
        "border": "5px solid red",
        "top": clientRect.top + "px",
        "right": clientRect.left + clientRect.width + "px",
      }
    }
    else {
      return {};
    } 
  }

  @Method()
  async setVideoElement(el) {
    this.videoElement = el;
    this.render();
  }

  render() {
    var styles = this.getPosition();
    console.log(styles);
    return (
      <Host style={styles}>
        <div>Streaming at x sats / sec</div>
      </Host>
    );
  }

}
