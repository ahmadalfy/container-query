// @flow
import Container from "../../container-query/src/Container";

export type Styles = {
  [property: string]: string
};

export type ElementData = {
  selector: string,
  styles: Styles,
  values: Styles
};

export type ContainerSize = {
  width: number,
  height: number
};

export type Node = {
  type: string,
  prop: string,
  value: string,
  selector: string,
  error: Function,
  nodes: Node[]
};

export type RegistryData = {
  instance: Container,
  jsonStats: QueryStats,
  queryState: boolean[]
};

export type QueryStats = {
  selector: string,
  queries: Array<{
    conditions: [string, string, string | number],
    conditionFunction: Function,
    elements: Array<{
      selector: string,
      styles: Styles,
      Values: Styles
    }>
  }>
};
