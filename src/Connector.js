import React from 'react';
import { Observable } from 'rxjs';
import invariant from 'invariant';
import { storeShape } from './storeShape';

export function Connector(Component, store) {
  this.Component = Component;
  this.store = store;
  this.moduleNames = [];
  this.mapper = state => state;
  this.dispatchMapper = undefined;
  this.clearOnUnmount = true;
}

Connector.prototype.withStateFrom = function(...moduleNames) {
  this.moduleNames = moduleNames;
  return this;
};

Connector.prototype.hydrateWith = function(hydrator) {
  this.hydrator = hydrator;
  return this;
};

Connector.prototype.mapStateTo = function(mapper) {
  this.mapper = mapper;
  return this;
};

Connector.prototype.mapDispatchTo = function(dispatchMapper) {
  this.dispatchMapper = dispatchMapper;
  return this;
};

Connector.prototype.clearStateOnUnmount = function(clearOnUnmount) {
  this.clearOnUnmount = clearOnUnmount;
  return this;
};

function getSingeState$(store, builder, hdrt) {
  let state$ = store.getState$(builder.moduleNames[0]);
  if (hdrt) {
    state$ = state$.filter(state => state.hydrated);
  }
  return state$.map(builder.mapper);
}

function getCombinedState$(store, builder, hdrt) {
  const state$s = builder.moduleNames.map(moduleName => {
    let state$ = store.getState$(moduleName);
    if (hdrt && hdrt[moduleName]) {
      state$ = state$.filter(state => state.hydrated);
    }
    return state$;
  });
  return Observable.combineLatest(...state$s, builder.mapper);
}

Connector.prototype.build = function() {
  const builder = this;
  const connectorDisplayName = 'Connector(' + (builder.Component.displayName || builder.Component.name || 'Unknown') + ')';

  class _ extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.store = builder.store || context.store;
      invariant(this.store,
        `The "store" was neither provided to the Connector or found in the context of "${connectorDisplayName}". ` +
        'Either wrap the root component in a <Provider>, or explicitly pass the "store" to the Connector.'
      );
    }

    componentWillMount() {
      this.dispatchProps = builder.dispatchMapper ? builder.dispatchMapper(this.store.dispatch) : {};

      if (!builder.moduleNames.length) {
        return;
      }

      const hdrt = builder.hydrator ? builder.hydrator(this.props) : undefined;

      const state$ = builder.moduleNames.length === 1
        ? getSingeState$(this.store, builder, hdrt)
        : getCombinedState$(this.store, builder, hdrt);

      this.subscription = state$.subscribe(state => this.setState(state));

      if (hdrt) {
        builder.moduleNames.forEach(moduleName => {
          if (hdrt[moduleName]) {
            this.store.hydrate(moduleName, hdrt[moduleName]);
          }
        });
      }
    }

    componentWillUnmount() {
      if (!builder.moduleNames.length) {
        return;
      }

      if (builder.clearOnUnmount) {
        const defined = typeof builder.clearOnUnmount === 'object';
        builder.moduleNames.forEach(moduleName => {
          if (defined && !builder.clearOnUnmount[moduleName]) {
            return;
          }
          this.store.clearState(moduleName);
        });
      }
      this.subscription.unsubscribe();
    }

    render() {
      const { Component } = builder;
      return <Component {...this.state} {...this.props} {...this.dispatchProps} />;
    }
  }
  _.displayName = connectorDisplayName;
  _.contextTypes = {
    store: storeShape
  };
  return _;
};

