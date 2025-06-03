import * as greenhouse from './greenhouse';
import * as bamboohr from './bamboohr';
import * as gmail from './gmail';

export const actionsByIntegration = {
  greenhouse: greenhouse.actions,
  bamboohr: bamboohr.actions,
  gmail: gmail.actions
};

export const triggersByIntegration = {
  greenhouse: greenhouse.triggers,
  bamboohr: bamboohr.triggers,
  gmail: gmail.triggers
};
