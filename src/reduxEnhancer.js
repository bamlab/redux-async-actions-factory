// @flow

import lodash from 'lodash';

// ACTION NAMES
type enhancedActionNames = {
  REQUEST?: {
    [string]: {
      START: string,
      SUCCESS: string,
      FAILED: string,
      RESET: string,
    },
  },
  resetStore: string,
};

export const enhanceActionTypes = (
  storeName?: string,
  requestActionTitles?: string[]
): enhancedActionNames => {
  let requestActionTypes = {};

  if (storeName && requestActionTitles) {
    const definedStoreName = storeName;
    requestActionTypes = requestActionTitles.reduce(
      (reduced, action) => ({
        ...reduced,
        REQUEST: {
          ...reduced.REQUEST,
          [action]: {
            START: `${definedStoreName}.REQUEST.${action}.START`,
            SUCCESS: `${definedStoreName}.REQUEST.${action}.SUCCESS`,
            FAILED: `${definedStoreName}.REQUEST.${action}.FAILED`,
            RESET: `${definedStoreName}.REQUEST.${action}.RESET`,
          },
        },
      }),
      { REQUEST: {} }
    );
  }

  return {
    ...requestActionTypes,
    resetStore: 'RESET_STORE',
  };
};

// ACTION CREATORS
export const enhanceActionCreators = (
  storeName?: string,
  requestActionTitles?: string[],
  actionTypes?: *
): { [string]: Function, emptyStore: Function } => {
  let requestActionCreators = {};

  if (requestActionTitles && actionTypes && actionTypes.REQUEST)
    requestActionCreators = requestActionTitles.reduce(
      (reducedObject, actionTitle) => {
        const camelCaseActionTitle = lodash.camelCase(actionTitle);
        const pascalCaseActionTitle =
          camelCaseActionTitle[0].toUpperCase() + camelCaseActionTitle.slice(1);

        return {
          ...reducedObject,
          [`request${pascalCaseActionTitle}Start`]: () => ({
            type: actionTypes && actionTypes.REQUEST[actionTitle].START,
          }),
          [`request${pascalCaseActionTitle}Success`]: () => ({
            type: actionTypes && actionTypes.REQUEST[actionTitle].SUCCESS,
          }),
          [`request${pascalCaseActionTitle}Failed`]: () => ({
            type: actionTypes && actionTypes.REQUEST[actionTitle].FAILED,
          }),
          [`request${pascalCaseActionTitle}Reset`]: () => ({
            type: actionTypes && actionTypes.REQUEST[actionTitle].RESET,
          }),
        };
      },
      {}
    );

  return {
    ...requestActionCreators,
    emptyStore: () => ({ type: 'RESET_STORE' }),
  };
};

// REDUCERS
export const enhanceDefaultState = (requestActionTitles: string[]) =>
  requestActionTitles.reduce(
    (reducedObject, actionTitle) => ({
      ...reducedObject,
      requests: {
        ...reducedObject.requests,
        [actionTitle]: {
          loading: false,
          failed: false,
        },
      },
    }),
    { requests: {} }
  );

const parseErrorIfExists = action => {
  const errorText = lodash.get(action, 'payload.err.response.text');
  return errorText ? JSON.parse(errorText) : false;
};

export const enhanceReducer = (
  storeName: string,
  state: any,
  action: any,
  initialState: any,
  reducer: any
) => {
  let enhancedState;

  const requestActionType = action.type.match(/(.*).REQUEST\.(.*)\.(.*)/);
  if (requestActionType && requestActionType[1] === storeName) {
    enhancedState = {
      ...state,
      requests: {
        ...state.requests,
        [requestActionType[2]]: {
          loading: requestActionType[3] === 'START',
          failed:
            parseErrorIfExists(action) || requestActionType[3] === 'FAILED',
        },
      },
    };
  }

  if (action.type === 'RESET_STORE') return { ...initialState };

  return reducer(enhancedState || state, action);
};

// SELECTORS
export const enhanceSelectors = (
  storeName: string,
  requestActionTitles: string[]
): { [string]: Function } =>
  requestActionTitles.reduce(
    (reducedObject, actionTitle) => ({
      ...reducedObject,
      [`${lodash.camelCase(actionTitle)}Loading`]: (state: *) =>
        lodash.get(
          state,
          `${lodash.camelCase(storeName)}.requests.${actionTitle}.loading`
        ),
      [`${lodash.camelCase(actionTitle)}Failed`]: (state: *) =>
        lodash.get(
          state,
          `${lodash.camelCase(storeName)}.requests.${actionTitle}.failed`
        ),
    }),
    {}
  );
