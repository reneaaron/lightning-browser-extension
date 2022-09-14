import { newSpecPage } from '@stencil/core/testing';
import { MyComponent } from './boost-button';

describe('boost-button', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [MyComponent],
      html: '<boost-button></boost-button>',
    });
    expect(root).toEqualHtml(`
      <boost-button>
        <mock:shadow-root>
          <div>
            Hello, World! I'm
          </div>
        </mock:shadow-root>
      </boost-button>
    `);
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [MyComponent],
      html: `<boost-button first="Stencil" last="'Don't call me a framework' JS"></boost-button>`,
    });
    expect(root).toEqualHtml(`
      <boost-button first="Stencil" last="'Don't call me a framework' JS">
        <mock:shadow-root>
          <div>
            Hello, World! I'm Stencil 'Don't call me a framework' JS
          </div>
        </mock:shadow-root>
      </boost-button>
    `);
  });
});
