import MonitorUsageClass from './core';
import { isInNodeEnv } from './utils';

function createMonitorUsage() {
  let instance: MonitorUsageClass;
  return () => {
    if (!instance) instance = new MonitorUsageClass();
    return instance;
  };
}

const MonitorUsage = createMonitorUsage();
export default MonitorUsage;

if (!isInNodeEnv() && process.env.NODE_ENV === 'production') {
  window.MonitorUsage = MonitorUsage;
}
