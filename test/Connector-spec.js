/* globals describe it */
import React from 'react';
import { expect } from 'chai';
import { createStore } from 'udeo';
import { Connector } from '../';
import { mount } from 'enzyme';

describe('Connector', () => {
  describe('withStateFrom', () => {
    it('handles subscribing to multiple modules', () => {
      const moduleOne = {
        flow(dispatch$) {
          return [dispatch$.filterAction('@test/FOO')];
        },
        reducer(state = [], action) {
          return state.concat(action.type);
        }
      };
      const moduleTwo = {
        flow(dispatch$) {
          return [dispatch$.filterAction('@test/BAR')];
        },
        reducer(state = [], action) {
          return state.concat(action.type);
        }
      };
      const store = createStore({
        moduleOne,
        moduleTwo,
      });

      const Component = ({ foo, bar }) => (
        <div>
          {foo.map((f, i) => <p key={i} className="foo">{f}</p>)}
          {bar.map((b, i) => <p key={i} className="bar">{b}</p>)}
        </div>
      );

      const Connected = new Connector(Component, store)
        .withStateFrom('moduleOne', 'moduleTwo')
        .mapStateTo(
          (m1State, m2State) => ({
            foo: m1State,
            bar: m2State,
          })
        )
        .build();

      const mounted = mount(<Connected />);

      store.dispatch({ type: '@test/FOO' });
      expect(mounted.find('.foo')).to.have.length(2);
      expect(mounted.find('.bar')).to.have.length(1);

      store.dispatch({ type: '@test/BAR' });
      expect(mounted.find('.foo')).to.have.length(2);
      expect(mounted.find('.bar')).to.have.length(2);
    });
  });
});
