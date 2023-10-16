# Monitor Usage

监控和追踪代码使用情况，便于详细地知道对应代码，何时、何地、何种类型以及是否执行出错。

## 特性

- 实时监控目标，自动响应报告信息
- 细颗粒度追踪每个被使用的目标所在源文件位置
- 查看目标被访问类型
- 汇合所有报告信息，导出为日志文件

## 安装

### 使用 npm 或 yarn 安装

```shell
npm install monitor-usage --save
```

```shell
yarn add monitor-usage
```

### 浏览器引入

在浏览器中使用 script 标签直接引入文件，并使用全局对象 MonitorUsage。

```html
<script src=""></script>
```

## 示例

> 注意：不支持目标为基本数据类型

### 监控 Object

```js
import MonitorUsage from 'monitor-usage';

const obj = {
  name: 'ayin'
  friends: {
    name: 'zs',
    age: 18
  }
};

const monitor = MonitorUsage.stares(obj, (repo) => {
  console.log('监控报告:', repo);
  // do something... 例如上传或者保存监控报告等等
});

// 以下操作会自动触发监控回调执行
monitor.name;
monitor.friends.name;
monitor.name = 'AYIN';
monitor.age = 88; // 新增属性
```

### 监控 Function

> 强烈推荐使用`命名函数`作为监控目标，而不是匿名函数或直接写入函数

```js
function namedFn() {
  return 'hello world!'
}

const fn = MonitorUsage.stares(namedFn, (repo) => {
  console.log('监控报告:', repo);
  // do something... 例如上传或者保存监控报告等等
});

fn();
```

还有其他的类型，这里不再不一一列举。

### TypeScript

`monitor-usage` 使用 TypeScript 进行书写并提供了完整的类型定义。

## API

| 属性   | 说明                         | 类型                                                         |
| ------ | ---------------------------- | ------------------------------------------------------------ |
| stares | 对目标进行监控               | (target: object, callback: (repo: object[]) => void, options?:` Options`) => void |
| export | 导出所有监控日志为`json`文件 | (name?: string, path?: string) => promise<string>            |

### Options

| 属性                 | 说明                                                  | 类型                |
| -------------------- | ----------------------------------------------------- | ------------------- |
| key                  | 唯一标识符。添加该key后，导出的报告文件才会包含该日志 | string \| undefined |
| isModifyValue        | 允许修改属性值                                        | boolean             |
| allowAdditionalProps | 允许添加新属性                                        | boolean             |