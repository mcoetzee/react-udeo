import { Component, PropTypes, Children } from 'react';
import { storeShape } from './storeShape';

export class Provider extends Component {
  getChildContext() {
    return { store: this.store };
  }

  constructor(props, context) {
    super(props, context);
    this.store = props.store;
  }

  render() {
    return Children.only(this.props.children);
  }
}

Provider.propTypes = {
  store: storeShape.isRequired,
  children: PropTypes.element.isRequired
};

Provider.childContextTypes = {
  store: storeShape.isRequired
};
