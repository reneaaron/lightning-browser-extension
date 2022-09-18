import { newE2EPage } from '@stencil/core/testing';

describe('video-overlay', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<video-overlay></video-overlay>');

    const element = await page.find('video-overlay');
    expect(element).toHaveClass('hydrated');
  });
});
