import { OpenFeatureClient } from './client';
import { DefaultLogger, SafeLogger } from './logger';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, EvaluationContext, EvaluationLifeCycle, FlagValue, Hook, Logger, Provider } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _global = global as OpenFeatureGlobal;

class OpenFeatureAPI implements EvaluationLifeCycle {
  private _provider: Provider = NOOP_PROVIDER;
  private _context: EvaluationContext = {};
  private _hooks: Hook[] = [];
  private _logger: Logger = new DefaultLogger();

  static getInstance(): OpenFeatureAPI {
    const globalApi = _global[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeatureAPI();
    _global[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  set logger(logger: Logger) {
    this._logger = new SafeLogger(logger);
  }

  get logger() {
    return this._logger;
  }

  getClient(name?: string, version?: string, context?: EvaluationContext): Client {
    return new OpenFeatureClient(
      () => this._provider,
      () => this._logger,
      { name, version },
      context
    );
  }

  get providerMetadata() {
    return this._provider.metadata;
  }

  addHooks(...hooks: Hook<FlagValue>[]): void {
    this._hooks = [...this._hooks, ...hooks];
  }

  get hooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  setProvider(provider: Provider) {
    this._provider = provider;
  }

  set context(context: EvaluationContext) {
    this._context = context;
  }

  get context(): EvaluationContext {
    return this._context;
  }

  clearHooks(): void {
    this._hooks = [];
  }
}

export const OpenFeature = OpenFeatureAPI.getInstance();
