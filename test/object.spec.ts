import MonitorUsage from '../src';

const monitor = MonitorUsage();

describe('测试目标为对象类型', () => {
  const obj = monitor.stares(
    { foo: 1, cb: (s: any, b: any) => s, o: { b: 20000 } },
    reports => {
      console.log('监视报告: ', reports);
    }
  );

  test('访问foo', () => {
    obj.foo;
  });
  // 别的属性值也被改了。解决办法：core.ts 173行
  test('修改foo', () => {
    obj.foo = 24;
  });

  // 嵌套对象捕获不到。解决办法：core.ts 223行
  test('访问多层对象', () => {
    obj.o.b;
  });

  test('新增属性', () => {
    // @ts-ignore
    obj.bar = 'i am an new key!';
  });

  test('调用方法', () => {
    expect(obj.cb('function', 'aaa')).toBe('function');
  });
});
