// @flow
import type { ContainerSize } from "./Container";
import type { Styles, QueryData, ElementData } from "../types";
import registry from "./containerRegistry";
import _union from "lodash.union";
import _difference from "lodash.difference";
import adjustValueObjectByContainerDimensions from "./adjustValueObjectByContainerDimensions";
import objectAssign from "object-assign";

// Styles to be applied and props to be removed from elements, based on their
// state and json stat
export type StyleChangeSet = {
    [selector: string]: {
        addStyle: Styles,
        removeProps: string[]
    }
};

function getAffectedPropsByElementData(elementData: ElementData): string[] {
    const affectedStyles = {};

    objectAssign(affectedStyles, elementData.styles);
    objectAssign(affectedStyles, elementData.values);

    return Object.keys(affectedStyles);
}

export default function getChangedStyles(
    element: HTMLElement,
    size: ContainerSize
) {
    const { queryState, jsonStats } = registry.get(element);
    const styleChangeSet: StyleChangeSet = {};
    const previouslyAppliedProps: {
        [selector: string]: string[]
    } = {};

    const queriesLength = jsonStats.queries.length - 1;
    for (let queryIndex = queriesLength; queryIndex >= 0; queryIndex--) {
        let queryData: QueryData = jsonStats.queries[queryIndex];
        // Default queries have no `conditionFunction`
        // @todo test if size was passed in the conditionFunction
        let doesCurrentlyApply =
            typeof queryData.conditionFunction === "function"
                ? queryData.conditionFunction(size)
                : true;
        let didPreviouslyApply = queryState[queryIndex];

        // @todo test this
        queryState[queryIndex] = doesCurrentlyApply;

        queryData.elements.forEach((elementData: ElementData) => {
            if (!styleChangeSet[elementData.selector]) {
                styleChangeSet[elementData.selector] = {
                    addStyle: {},
                    removeProps: []
                };
            }
            if (!previouslyAppliedProps[elementData.selector]) {
                previouslyAppliedProps[elementData.selector] = [];
            }

            let elementStyleChangeSet = styleChangeSet[elementData.selector];
            let elementPreviouslyAppliedProps =
                previouslyAppliedProps[elementData.selector];
            let elementAffectedProps = getAffectedPropsByElementData(
                elementData
            );

            if (doesCurrentlyApply && didPreviouslyApply) {
                // Only the values need to be recalculated
                const applicableValueObject = {};
                let applicableValuePropCount = 0;
                for (let prop in elementData.values) {
                    if (
                        elementPreviouslyAppliedProps.indexOf(prop) === -1 ||
                        elementStyleChangeSet.removeProps.indexOf(prop) !== -1
                    ) {
                        // Add value to addStyle if the prop wasn't affected by
                        // previous queries, or even if it was, it was about to
                        // be removed
                        // if (typeof elementStyleChangeSet.addStyle[prop] === 'undefined') {
                        applicableValuePropCount++;
                        applicableValueObject[prop] = elementData.values[prop];

                        let index = elementStyleChangeSet.removeProps.indexOf(
                            prop
                        );
                        if (index !== -1) {
                            elementStyleChangeSet.removeProps.splice(index, 1);
                        }
                    }
                }

                const currentAddStyle = {};

                // See if there's a property which needs to be readded and
                // removed from "removeProps", since this query adds it
                for (let prop in elementData.styles) {
                    let index = elementStyleChangeSet.removeProps.indexOf(prop);
                    if (index !== -1) {
                        elementStyleChangeSet.removeProps.splice(index, 1);
                        currentAddStyle[prop] = elementData.styles[prop];
                    }
                }

                // Merge in value object
                if (applicableValuePropCount > 0) {
                    objectAssign(
                        currentAddStyle,
                        adjustValueObjectByContainerDimensions(
                            size,
                            applicableValueObject
                        )
                    );
                }

                objectAssign(
                    styleChangeSet[elementData.selector].addStyle,
                    currentAddStyle
                );
            } else if (!doesCurrentlyApply && didPreviouslyApply) {
                // Create removeProps object from all affected styles, overshadowed by previously affected props
                let applicableRemoveProps = _difference(
                    elementAffectedProps,
                    elementPreviouslyAppliedProps
                );
                styleChangeSet[elementData.selector].removeProps = _union(
                    styleChangeSet[elementData.selector].removeProps,
                    applicableRemoveProps
                );
            } else if (doesCurrentlyApply && !didPreviouslyApply) {
                // Create new addStyle object, overshadowed by previouslyAppliedProps.
                // Also remove anything in the new addStyle object from the current removeProps
                const currentAddStyle: Styles = {};

                for (let prop in elementData.styles) {
                    if (elementPreviouslyAppliedProps.indexOf(prop) === -1) {
                        currentAddStyle[prop] = elementData.styles[prop];
                    }
                }
                for (let prop in elementData.values) {
                    if (elementPreviouslyAppliedProps.indexOf(prop) === -1) {
                        currentAddStyle[prop] = elementData.values[prop];
                    }
                }

                const applicableCurrentAddStyle = adjustValueObjectByContainerDimensions(
                    size,
                    currentAddStyle
                );

                // Removing props now about to be applied from previous removeProps array
                for (let prop in applicableCurrentAddStyle) {
                    let index = styleChangeSet[
                        elementData.selector
                    ].removeProps.indexOf(prop);
                    if (index !== -1) {
                        styleChangeSet[elementData.selector].removeProps.splice(
                            index,
                            1
                        );
                    }
                }

                objectAssign(
                    styleChangeSet[elementData.selector].addStyle,
                    applicableCurrentAddStyle
                );
            }

            previouslyAppliedProps[elementData.selector] = _union(
                previouslyAppliedProps[elementData.selector],
                elementAffectedProps
            );
        });
    }

    return styleChangeSet;
}