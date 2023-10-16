import {
  deepClone,
  getDateString,
  isInNodeEnv,
  isPrimitiveType,
  typeOf,
} from './utils';

type ReportingFunc = (repo: ReportInfo[]) => void;

interface ReportInfo {
  newValue: any;
  oldValue: any;
  source: any;
  log: string;
  position: string;
  filepath?: string;
  usageTime: string;
  whenToAdd?: string;
  lastModify?: string;
  usageCount: number;
  isNewlyAdded: boolean;
  status: 'OK' | 'Fail';
  name: string | symbol;
  usageType:
    | 'Unkown'
    | 'Get'
    | 'Modify'
    | 'Has'
    | 'Delete'
    | 'Method Call'
    | 'Function Call';
}
interface MonitorUsageOptions {
  /**如果没有设置key，调用export方法导出的报告文件不会包含当前记录 */
  key?: string;
  /**是否可以修改属性值 */
  isModifyValue: boolean;
  /**是否允许添加属性 */
  allowAdditionalProps: boolean;
}

type GclResult = {
  filepath: string;
  position: string;
};

const jsnk = (key: any) => JSON.stringify(key);

const defaultMonitorUsageOptions: MonitorUsageOptions = {
  isModifyValue: true,
  allowAdditionalProps: true,
};

const specialTypes = ['Map', 'Set', 'WeakMap'];

export default class MonitorUsageClass {
  static proxyMemo = new WeakMap();

  /**
   * 存储需要导出的报告信息
   */
  static recordsToExport: Record<string, ReportInfo[]> = {};

  /**
   * 存储监控对象的key调用次数
   */
  static keyUsesMap: Record<string | symbol, number> = {};

  /**
   * 临时存储报告记录
   */
  static tempRecords: WeakMap<object, ReportInfo[]> = new WeakMap();

  /**
   * 当外部调用create方法时，创建的监控对象会和它的报告回调，弱存储在一起
   */
  static saveTraps: WeakMap<object, ReportingFunc> = new WeakMap();

  /**
   * 监控对象为匿名函数时，因为没有函数名所有用id表示
   */
  static anonymousFid = 0;

  private getReportObj(source: any): ReportInfo {
    return {
      source,
      name: '',
      status: 'OK',
      usageCount: 0,
      usageType: 'Unkown',
      usageTime: getDateString(),
      oldValue: undefined,
      newValue: undefined,
      isNewlyAdded: false,
      whenToAdd: undefined,
      lastModify: undefined,
      log: 'no problem',
      position: '',
      filepath: '',
    };
  }

  /**
   * 获取被监控代码所在的行和列数
   * @returns {GclResult}
   */
  static gcl(err: Error): GclResult {
    // 利用Error方法记录的执行堆栈信息，获取代码位置
    const stackLines = err.stack.split('\n')[2].trim();
    const lines = stackLines.split(':');
    /**
     * lines example result:
     * [
     *   'at Object.<anonymous> (d',
     *   '\\project\\ideas\\monitor-usage\\src\\core.ts',
     *   '300', --> line
     *   '21)' --> row
     * ]
     */
    const row = lines.pop().replace(')', '');
    const line = lines.pop();

    return {
      filepath: stackLines.match(/\((.*?)\)/)[1],
      position: `trace the code to line ${line}, row ${row}`,
    };
  }

  /**
   * 触发监视回调执行以及存储报告信息
   */
  static trap(data: {
    target: object;
    repo: ReportInfo;
    err: Error;
    recordKey?: string;
    callback?: ReportingFunc;
  }) {
    const { target, repo, err, recordKey, callback } = data;

    if (!this.saveTraps.has(target)) {
      this.saveTraps.set(target, callback!);
    }
    if (!this.tempRecords.has(target)) {
      this.tempRecords.set(target, []);
    }

    const fn = this.saveTraps.get(target);
    const records = this.tempRecords.get(target).slice();
    const newRepo = { ...repo, ...this.gcl(err) };

    records.push(newRepo);
    fn?.(records);

    this.tempRecords.set(target, records);
    recordKey && this.recordsToExport[recordKey]?.push(newRepo);
  }

  private createStares<T extends object>(
    source: T,
    callback: ReportingFunc,
    options?: MonitorUsageOptions,
    prevLevelKey?: string | symbol
  ): T {
    if (isPrimitiveType(source)) {
      throw TypeError(
        '[MonitorUsage error]: you must pass in non-basic data types as monitoring source'
      );
    }

    MonitorUsageClass.saveTraps.set(source, callback);

    if (options.key && !(options.key in MonitorUsageClass.recordsToExport)) {
      MonitorUsageClass.recordsToExport[options.key] = [];
    }

    const that = this;

    // 通过工厂函数返回创建方法，每次拦截操作都创建新的对象，防止重复使用
    const createRepoFactory = () =>
      this.getReportObj(
        source != null && typeof source === 'object'
          ? jsnk(deepClone(source))
          : source.toString()
      );

    const changeUsageCountAndTime = (
      key: string | symbol,
      repo: ReportInfo
    ) => {
      const newCount = (MonitorUsageClass.keyUsesMap[key] ?? 0) + 1;
      repo.usageCount = newCount;
      repo.usageTime = getDateString();
      MonitorUsageClass.keyUsesMap[key] = newCount;
    };

    const triggerTrap = (target: object, repo: ReportInfo, err: Error) => {
      MonitorUsageClass.trap({
        target,
        repo,
        err,
        recordKey: options.key,
      });
    };

    const accessedName = (key: string | symbol) =>
      prevLevelKey ? `${String(prevLevelKey)}.${String(key)}` : key;

    const proxyHandler: ProxyHandler<T> = {
      has(target, key) {
        const repo = createRepoFactory();
        const res = Reflect.has(target, key);

        repo.name = accessedName(key);
        repo.usageType = 'Has';
        repo.log = 'this property exists in source';

        if (!res) {
          repo.status = 'Fail';
          repo.log = 'this property does not exist in the target';
        }

        changeUsageCountAndTime(key, repo);
        triggerTrap(target, repo, new Error());

        return res;
      },

      get(target, key, receiver) {
        const repo = createRepoFactory();
        const value = Reflect.get(target, key, receiver);

        // 解决嵌套对象代理不到的问题，递归
        if (value != null && typeof value === 'object') {
          return that.createStares(value, callback, options, key);
        }

        repo.usageType = 'Get';
        repo.name = accessedName(key);

        changeUsageCountAndTime(key, repo);

        const targetType = typeOf(target);

        // 对于特殊类型：Map、Set、WeakMap，调用其方法时，实际上相当于get操作，直接返回即可
        if (specialTypes.includes(typeOf(target))) {
          repo.usageType =
            `${targetType} ${key.toString()}` as ReportInfo['usageType'];

          triggerTrap(target, repo, new Error());

          // 返回的目标属性方法需要使用 bind 重新指定 this 指向代理目标，否则会丢失 this
          return (value as Function).bind(target);
        }

        // 调用对象的方法
        if (typeOf(value) === 'Function') {
          repo.usageType = 'Method Call';
          try {
            repo.log = 'object method is called';
            (value as Function).apply(target);
          } catch (error) {
            repo.status = 'Fail';
            repo.log = 'an error occurred while calling the method';

            console.error(
              '[MonitorUsage error]: an error occurred while calling the method',
              '\n key: ',
              key,
              '\n target: ',
              target,
              '\n',
              error
            );
          } finally {
            triggerTrap(target, repo, new Error());
          }
        } else if (!Reflect.has(target, key)) {
          if (!options.allowAdditionalProps) {
            repo.status = 'Fail';
            repo.log = 'this property does not exist in the source';

            triggerTrap(target, repo, new Error());

            console.warn(
              "[MonitorUsage warn]: cannot add new properties because 'options.allowAdditionalProps' is set to 'false'"
            );
          } else {
            repo.isNewlyAdded = true;
            repo.log = 'this is a newly added property';

            Reflect.set(target, key, undefined);

            triggerTrap(target, repo, new Error());

            console.log(
              '[MonitorUsage info]: added a new property',
              '\n key: ',
              key,
              '\n target: ',
              target,
              '\n'
            );
          }
        } else {
          repo.log = 'property accessed';
          triggerTrap(target, repo, new Error());
        }

        return value;
      },

      set(target, key, newValue, receiver) {
        const repo = createRepoFactory();
        const oldValue = Reflect.get(target, key, receiver);

        repo.usageType = 'Modify';
        repo.oldValue = oldValue;
        repo.name = accessedName(key);

        changeUsageCountAndTime(key, repo);

        if (!options.isModifyValue) {
          repo.status = 'Fail';
          repo.log = 'this value is not allowed to be modified';

          triggerTrap(target, repo, new Error());

          console.warn(
            "[MonitorUsage warn]: cannot modify value because 'options.isModifyValue' is set to 'false'"
          );

          return false;
        }

        if (!Reflect.has(target, key)) {
          repo.isNewlyAdded = true;
          repo.log = 'a newly set property';
          repo.oldValue = newValue.toString();

          triggerTrap(target, repo, new Error());

          console.log(
            '[MonitorUsage info]: added a new property',
            '\n key: ',
            key,
            '\n target: ',
            target,
            '\n'
          );

          return Reflect.set(target, key, newValue, receiver);
        }

        if (Object.is(oldValue, newValue)) {
          repo.log = 'ignore updating old and new equal values';
          triggerTrap(target, repo, new Error());
          return false;
        }

        repo.log = 'update value';
        repo.newValue = newValue.toString();
        repo.lastModify = getDateString();

        triggerTrap(target, repo, new Error());

        return Reflect.set(target, key, newValue, receiver);
      },

      deleteProperty(target, key) {
        const repo = createRepoFactory();
        const res = Reflect.deleteProperty(target, key);

        repo.name = accessedName(key);
        repo.usageType = 'Delete';
        repo.log = 'the property has been deleted';

        if (!res) {
          repo.status = 'Fail';
          repo.log = 'the property cannot be deleted';
        }

        triggerTrap(target, repo, new Error());

        return res;
      },

      apply(target, thisArg, argArray) {
        const repo = createRepoFactory();
        const funcName =
          (target as Function)?.name ||
          `anonymous_fid_${++MonitorUsageClass.anonymousFid}`;

        repo.name = funcName;
        repo.usageType = 'Function Call';

        changeUsageCountAndTime(funcName, repo);

        try {
          const result = Reflect.apply(target as Function, thisArg, argArray);

          repo.log = `is called with arguments: ${jsnk(
            argArray
          )}, and the result of the call is ${jsnk(result)}`;

          return result;
        } catch (error) {
          repo.status = 'Fail';
          repo.log = 'function call error';

          console.error(
            '[MonitorUsage error]: function call error',
            '\n name: ',
            funcName,
            '\n function: ',
            target.toString(),
            '\n',
            error
          );
        } finally {
          triggerTrap(target, repo, new Error());
        }
      },

      construct(target, argArray, newTarget) {
        const repo = createRepoFactory();
        const constructorName = newTarget.name;

        repo.usageType = 'Construct Function' as ReportInfo['usageType'];
        changeUsageCountAndTime(constructorName, repo);

        try {
          repo.log = `constructor called with arguments: ${jsnk(argArray)}`;
          return Reflect.construct(target as any, argArray, newTarget);
        } catch (error) {
          repo.status = 'Fail';
          repo.log = 'an error occurred construct function';

          console.error(
            '[MonitorUsage error]: an error occurred construct function',
            '\n name: ',
            constructorName,
            '\n function: ',
            newTarget.toString(),
            '\n',
            error
          );
        } finally {
          triggerTrap(target, repo, new Error());
        }
      },

      ownKeys(target) {
        const repo = createRepoFactory();
        repo.name = '@@the key of the entire source';
        repo.log = 'target is traversed';
        repo.usageTime = getDateString();
        triggerTrap(target, repo, new Error());
        return Reflect.ownKeys(target);
      },
    };

    return new Proxy(source, proxyHandler);
  }

  /**
   * 创建监控对象
   * @param {object} source 目标对象，非基本数据类型
   * @param {ReportingFunc} callback 监控的回调事件
   * @param {MonitorUsageOptions} options 配置选项
   * @returns
   */
  public stares<T extends object>(
    source: T,
    callback: ReportingFunc,
    options: MonitorUsageOptions = defaultMonitorUsageOptions
  ): T {
    if (MonitorUsageClass.proxyMemo.has(source)) {
      return MonitorUsageClass.proxyMemo.get(source);
    }
    const proxy = this.createStares(source, callback, options);
    MonitorUsageClass.proxyMemo.set(source, proxy);
    return proxy;
  }

  /**
   * 导出JSON格式的日志文件
   * @param name 文件名
   * @param _path 存放路径
   */
  public export(name = 'reports', _path?: string): Promise<string> {
    const reports = JSON.stringify(MonitorUsageClass.recordsToExport);

    if (isInNodeEnv() && process.env.NODE_ENV !== 'production') {
      const fs = require('fs');
      const path = require('path');
      const jsonString = JSON.stringify(reports);
      const filePath = path.join(_path ?? __dirname, `${name}.json`);

      return new Promise((res, rej) => {
        fs.writeFile(filePath, jsonString, 'utf8', (err: any) => {
          if (err) {
            console.error(
              `[MonitorUsage error]: an error occurred while exporting the file: 
              ${err}
              `
            );
            rej(err);
            return;
          }
          res(filePath);
        });
      });
    }

    return new Promise((res, rej) => {
      try {
        const blod = new Blob([reports], { type: 'application/json' });
        const url = URL.createObjectURL(blod);
        const link = document.createElement('a');

        link.href = url;
        link.download = `${name}.json`;
        link.click();

        res(url);
        URL.revokeObjectURL(url);
      } catch (error) {
        rej(error);
      }
    });
  }
}
