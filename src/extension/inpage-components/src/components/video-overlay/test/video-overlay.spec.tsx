import { newSpecPage } from '@stencil/core/testing';
import { VideoOverlay } from '../video-overlay';

describe('video-overlay', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [VideoOverlay],
      html: `<video-overlay></video-overlay>`,
    });
    expect(page.root).toEqualHtml(`
      <video-overlay>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </video-overlay>
    `);
  });
});
