import MonitorUsage from '..';

const monitor = MonitorUsage();

describe('测试目标为Map类型', () => {
  const map = monitor.stares(new Map(), reports => {
    console.log('监视报告: ', reports);
  });

  test('set map', () => {
    // map.xxx is not a function 解决办法： core.ts 246 行
    map.set('a', 1);
  });

  test('get map', () => {
    map.get('a');
  });

  test('get map', () => {
    map.has('a');
  });
});
