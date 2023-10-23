import MonitorUsage from '..';

const monitor = MonitorUsage();

describe('测试目标为函数类型', () => {
  test('声明式普通函数', () => {
    const fn = monitor.stares(
      function func(a: number, b: number) {
        return a + b;
      },
      reports => {
        console.log(reports);
      }
    );
    fn(1, 2);
  });

  test('声明式箭头函数', () => {
    const allowFn = (a: number, b: number) => a + b;
    const fn = monitor.stares(allowFn, reports => {
      console.log(reports);
    });
    fn(1, 2);
  });

  test('匿名函数', () => {
    const fn = monitor.stares(
      (a: number, b: number) => a + b,
      reports => {
        console.log(reports);
      }
    );
    fn(1, 2);
  });
});
