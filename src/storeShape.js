import { PropTypes } from 'react';

export const storeShape = PropTypes.shape({
  getState$: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  hydrate: PropTypes.func.isRequired,
  clearState: PropTypes.func.isRequired,
});
