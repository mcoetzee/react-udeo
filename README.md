# react-udeo (alpha)
React bindings for [Udeo](https://github.com/mcoetzee/udeo)

Provides:

- A Connector to connect React components to the Udeo store
- A Provider (ala Redux) to provide the Udeo store to the connected components

## Install

NOTE: This has peer dependencies of `rxjs@5.0.*` and React 0.14 or later

```sh
npm install --save react-udeo
```
## Connector
### Basic Usage
Subscribing to a single state stream:
```js
import { Connector } from 'react-udeo';
import React from 'react';

class Finder extends React.Component {
  render() {
    ...
  }
}

export default new Connector(Finder)
  // Subscribe to single module's state stream
  .withStateFrom('finder')
  // By default will clear module's state on unmount
  .build();
```
Only mapping the store's dispatch to props (no state stream subscription):
```js
export default new Connector(SearchBox)
   // Map the store's dispatch to props 
  .mapDispatchTo(
    dispatch => ({
      onSearch(query) {
        dispatch({ type: 'SEARCH', payload: query });
      }
    })
  )    
  .build();
```

### More Advanced Usage 
Subscribing to multiple state streams and selectively clearing state on unmount:
```js
export default new Connector(Finder)
  // Subscribe to multiple state streams
  .withStateFrom('finder', 'shoppingCart')
  // Map the state from multiple modules to props
  .mapStateTo(
    (finderState, cartState) => ({
      ...finderState,
      totalCost: cartState.totalCost,
    })
  )
  // Map the store's dispatch to props 
  .mapDispatchTo(
    dispatch => ({
      onSearch(query) {
        dispatch({ type: 'SEARCH', payload: query });
      }
    })
  )
  // Specify what to do with the state when component unmounts
  .clearStateOnUnmount({
    finder: true,
    shoppingCart: false,
  })
  .build();
```
Hydrating the state stream with computed props:
```js
export default new Connector(AvailabilityChecker)
  .withStateFrom('availability')
  .hydrateWith(
    props => ({
      availability: {
        arrival: props.vacationStartDate,
        departure: new Moment(props.vacationStartDate).add(3, 'days')
      }
    }) 
  )
  .build();
```
## Provider
```js
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import { createStore } from 'udeo';
import { Provider } from 'react-udeo';
...

const store = createStore(...);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
```
