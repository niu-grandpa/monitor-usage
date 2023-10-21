# Monitor Usage

一款基于 Javascript 的代码监控工具，用于实时监控和追踪目标代码使用情况，收集代码运行日志报告等。

## 特性

- 实时监控目标代码，自动响应报告信息。
- 追踪目标代码所在源文件位置。
- 汇合所有报告信息，导出为日志文件。
- 记录目标被操作类型、使用频率、次数以及操作的时间等，详见下方API。

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
<script src="https://unpkg.com/browse/monitor-usage@1.0.1/dist/monitor-usage.js"></script>
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
| stares | 对目标进行监控               | (target: object, callback: (repo:  `ReportInfo[]`) => void, options?:`Options`) => void |
| export | 导出所有监控日志为`json`文件 | (name?: string, path?: string) => promise<string>            |

### Options 

选项字段说明

| 属性                 | 说明                                                  | 类型                |
| -------------------- | ----------------------------------------------------- | ------------------- |
| key                  | 唯一标识符。添加该key后，导出的报告文件才会包含该日志 | string \| undefined |
| isModifyValue        | 允许修改属性值                                        | boolean             |
| allowAdditionalProps | 允许添加新属性                                        | boolean             |
| showErrorView        | 捕获错误时在页面展示提示框                            | boolean             |

### ReportInfo

日志信息字段说明

| 熟悉           | 说明                             | 类型    | 默认值     |
| -------------- | -------------------------------- | ------- | ---------- |
| status         | 监控目标使用状态                 | string  | OK         |
| source         | 源目标                           | any     | -          |
| useageName     | 监控目标被访问的属性名           | string  | -          |
| usageCount     | 监控目标的使用次数               | number  | 0          |
| usageType      | 监控目标的访问类型               | string  | Unkown     |
| usageTime      | 监控目标当前使用时间             | string  | new Date() |
| dailyUsageRate | 监控目标的日平均使用率           | string  | 0%         |
| info           | 日志信息                         | string  | no problem |
| oldValue       | 监控目标属性值修改前的旧值       | any     | -          |
| newValue       | 监控目标属性值修改后的新值       | any     | -          |
| isNewlyAdded   | 是否为新添加的属性               | boolean | false      |
| whenToAdd      | 何时添加的属性                   | string  | -          |
| lastModify     | 最后修改时间，属性值被修改时更新 | string  | -          |
| position       | 监控目标所在源文件内的行列数     | string  | -          |
| filepath       | 监控目标的文件路径               | string  | -          |

