import { isInNodeEnv } from '../utils';

let elem: HTMLElement = null;

function createErrorView() {
  const wrapper = document.createElement('div');
  const box = document.createElement('div');
  const close = document.createElement('span');
  const title1 = document.createElement('h2');
  const title2 = document.createElement('h2');
  const title3 = document.createElement('h3');
  const errInfo = document.createElement('div');

  box.className = '__err_view__';
  close.className = '__err_view_close__';
  title1.className = '__err_view_h2__';
  title2.className = '__err_view_h2__';
  title3.className = '__err_view_h3__';
  wrapper.className = '__err_view_mask__';

  errInfo.id = 'errViewInfo';

  title1.textContent = '[MonitorUsage]';
  title3.textContent = 'Error stack';

  close.onclick = () => (wrapper.style.display = 'none');

  box.append(close, title1, title2, title3);
  wrapper.appendChild(box);

  return wrapper;
}

function injectStyle() {
  const style = document.createElement('style');
  style.textContent = `
  .__err_view_mask__ {
    display: none;
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
  
    & .__err_view__ {
      width: 680px;
      height: 420px;
      max-height: 420px;
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 6px 24px;
      border-radius: 6px;
      overflow: auto;
      color: #ff4d4f;
      background-color: #e6e7eb;
  
      & .__err_view_close__ {
        position: absolute;
        right: 20px;
        top: 10px;
        cursor: pointer;
      }
  
      & .__err_view_h2__ {
        font-size: 1.5em;
      }
  
      & .__err_view_h3__ {
        font-size: 1.171em;
      }
    }
  }
  `;
  return style;
}

export default function showErrorView(error: Error) {
  if (isInNodeEnv()) return;
  if (!elem) {
    elem = createErrorView();
    document.body.append(injectStyle(), elem);
  }

  const stack = error.stack.split('\n');
  stack.shift();

  const content = document.querySelector('#errViewInfo');
  const errType = document.querySelector('.__err_view_h2__');

  const nodes = stack.map(text => {
    const div = document.createElement('div');
    div.textContent = text;
    return div;
  });

  // @ts-ignore
  errType.textContent = error.message;
  content.innerHTML = null;
  content.append(...nodes);

  elem.style.display = 'block';
}
