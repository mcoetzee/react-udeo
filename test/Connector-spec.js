/* globals describe it */
import React from 'react';
import { expect } from 'chai';
import { createStore } from 'udeo';
import { Connector, Provider } from '../';
import { mount } from 'enzyme';

const FOO = '@test/FOO';
const BAR = '@test/BAR';

describe('Connector', () => {
  describe('with state from a single module', () => {
    it('receives state updates', () => {
      const initialState = { foos: ['Tommy'] };
      const fooModule = {
        flow(dispatch$) {
          return [
            dispatch$.filterAction(FOO)
          ];
        },
        reducer(state = initialState, action) {
          switch (action.type) {
            case FOO:
              return {
                ...state,
                foos: state.foos.concat(action.payload)
              };
            default:
              return state;
          }
        }
      };

      const store = createStore({ fooModule });

      const Component = ({ foos }) => (
        <div>
          {foos.map((f, i) => <p key={i}>-{f}-</p>)}
        </div>
      );

      const Connected = new Connector(Component)
        .withStateFrom('fooModule')
        .build();

      const mounted = mount(
        <Provider store={store}>
          <Connected />
        </Provider>
      );

      expect(mounted.text()).to.eq('-Tommy-');

      store.dispatch({ type: FOO, payload: 'Shelby' });
      expect(mounted.text()).to.eq('-Tommy--Shelby-');

      store.dispatch({ type: BAR, payload: 'Arthur' });
      expect(mounted.text()).to.eq('-Tommy--Shelby-');
    });

    it('hydrates with computed props', () => {
      const initialState = { value: 0 };
      const fooModule = {
        flow(dispatch$) {
          return [
            dispatch$.filterAction(FOO)
          ];
        },
        reducer(state = initialState, action) {
          return state;
        }
      };

      const store = createStore({ fooModule });

      const Component = ({ value }) => (
        <div>
          The answer is {value}
        </div>
      );

      const Connected = new Connector(Component)
        .withStateFrom('fooModule')
        .hydrateWith(
          props => ({
            fooModule: { value: props.initialValue + 10 }
          })
        )
        .build();

      const mounted = mount(
        <Provider store={store}>
          <Connected initialValue={32} />
        </Provider>
      );

      expect(mounted.text()).to.eq('The answer is 42');
    });

    it('maps state', () => {
      const initialState = { valueA: 21, valueB: 42 };
      const fooModule = {
        flow(dispatch$) {
          return [
            dispatch$.filterAction(FOO)
          ];
        },
        reducer(state = initialState, action) {
          return state;
        }
      };

      const store = createStore({ fooModule });

      const Component = ({ valueA }) => (
        <div>
          Value A is {valueA}
        </div>
      );

      const Connected = new Connector(Component)
        .withStateFrom('fooModule')
        .mapStateTo(
          fooState => ({
            valueA: fooState.valueA,
          })
        )
        .build();

      const mounted = mount(
        <Provider store={store}>
          <Connected />
        </Provider>
      );

      expect(mounted.find(Component).props()).to.have.all.keys(['valueA']);
      expect(mounted.find(Component).text()).to.eq('Value A is 21');
    });

    it('maps dispatch', () => {
      const initialState = { valueA: 20, valueB: 42 };
      const fooModule = {
        flow(dispatch$) {
          return [
            dispatch$.filterAction(FOO)
          ];
        },
        reducer(state = initialState, action) {
          switch (action.type) {
            case FOO:
              return {
                ...state,
                valueA: state.valueA * 2,
                valueB: state.valueB * 2,
              };
            default:
              return state;
          }
        }
      };

      const store = createStore({ fooModule });

      const Component = ({ valueA, valueB, onDubble }) => (
        <div>
          <span className="values">A: {valueA} B: {valueB}</span>
          <button id='dubble' onClick={onDubble}>Dubble</button>
        </div>
      );

      const Connected = new Connector(Component)
        .withStateFrom('fooModule')
        .mapDispatchTo(
          dispatch => ({
            onDubble() {
              dispatch({ type: FOO });
            }
          })
        )
        .build();

      const mounted = mount(
        <Provider store={store}>
          <Connected />
        </Provider>
      );

      expect(mounted.find(Component).props()).to.have.all.keys(['valueA', 'valueB', 'onDubble']);
      expect(mounted.find('.values').text()).to.eq('A: 20 B: 42');

      mounted.find('#dubble').simulate('click');
      expect(mounted.find('.values').text()).to.eq('A: 40 B: 84');

      mounted.find('#dubble').simulate('click');
      expect(mounted.find('.values').text()).to.eq('A: 80 B: 168');
    });

    it('clears state on unmount', () => {
      const initialState = { valueA: 20, valueB: 42 };
      const fooModule = {
        flow(dispatch$) {
          return [
            dispatch$.filterAction(FOO)
          ];
        },
        reducer(state = initialState, action) {
          switch (action.type) {
            case FOO:
              return {
                ...state,
                valueA: state.valueA * 2,
                valueB: state.valueB * 2,
              };
            default:
              return state;
          }
        }
      };

      const store = createStore({ fooModule });

      const Component = ({ onDubble }) => (
        <button id='dubble' onClick={onDubble}>Dubble</button>
      );

      const Connected = new Connector(Component)
        .withStateFrom('fooModule')
        .mapDispatchTo(
          dispatch => ({
            onDubble() {
              dispatch({ type: FOO });
            }
          })
        )
        .build();

      const mounted = mount(
        <Provider store={store}>
          <Connected />
        </Provider>
      );

      let fooState;
      store.getState$('fooModule').subscribe(state => {
        fooState = state;
      });

      mounted.find('#dubble').simulate('click');
      mounted.find('#dubble').simulate('click');

      expect(fooState).to.deep.eq({ valueA: 80, valueB: 168 });

      mounted.unmount();
      expect(fooState).to.deep.eq({ valueA: 20, valueB: 42 });
    });
  });
});
