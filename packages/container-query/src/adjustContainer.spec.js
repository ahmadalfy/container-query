import adjustContainer from "./adjustContainer";

jest.mock("./applyStylesToElements");
jest.mock("./getChangedStyles");
jest.mock("./getContainerDimensions");
jest.mock("./containerRegistry", () => ({
    get: jest.fn()
}));

beforeEach(() => {
    require("./applyStylesToElements").default.mockClear();
    require("./getChangedStyles").default.mockClear();
    require("./getContainerDimensions").default.mockClear();
    require("./containerRegistry").get.mockClear();
});

test("should be able to get the container size itself, and ignore empty change sets", () => {
    const containerRegistry = require("./containerRegistry");
    const applyStylesToElements = require("./applyStylesToElements").default;
    const getChangedStyles = require("./getChangedStyles").default;
    const getContainerDimensions = require("./getContainerDimensions").default;
    const containerElement = document.createElement("div");
    const containerSize = { width: 1, height: 2 };
    getContainerDimensions.mockImplementationOnce(() => containerSize);
    containerRegistry.get.mockImplementationOnce(() => {
        return {
            queryState: [],
            jsonStats: {
                queries: []
            }
        };
    });
    getChangedStyles.mockImplementationOnce(() => ({
        ".Container": {
            addStyle: {},
            removeProps: []
        }
    }));

    adjustContainer(containerElement);

    expect(containerRegistry.get).toHaveBeenCalledTimes(1);
    expect(containerRegistry.get).toHaveBeenCalledWith(containerElement);
    expect(getContainerDimensions).toHaveBeenCalledTimes(1);
    expect(getContainerDimensions).toHaveBeenCalledWith(containerElement);
    expect(getChangedStyles).toHaveBeenCalledTimes(1);
    expect(getChangedStyles).toHaveBeenCalledWith(
        containerElement,
        containerSize
    );

    // This proves that empty change sets are ignored
    expect(applyStylesToElements).toHaveBeenCalledTimes(0);
});

test("should apply changed styles", () => {
    const containerRegistry = require("./containerRegistry");
    const applyStylesToElements = require("./applyStylesToElements").default;
    const getChangedStyles = require("./getChangedStyles").default;
    const getContainerDimensions = require("./getContainerDimensions").default;
    const containerElement = document.createElement("div");
    const containerChildElement1 = document.createElement("div");
    const containerChildElement2 = document.createElement("div");
    const containerChildren = [containerChildElement1, containerChildElement2];
    containerElement.querySelectorAll = jest.fn(selector => {
        expect(selector).toBe(".Container__element");

        return containerChildren;
    });

    const containerSize = { width: 1, height: 2 };
    containerRegistry.get.mockImplementationOnce(() => {
        return {
            queryState: [],
            jsonStats: {
                selector: ".Container",
                queries: []
            }
        };
    });
    getChangedStyles.mockImplementationOnce(() => ({
        ".Container": {
            addStyle: {
                lineHeight: "10px",
                background: "none"
            },
            removeProps: ["fontSize", "border"]
        },
        ".Container__unchangedElement": {
            addStyle: {},
            removeProps: []
        },
        ".Container__element": {
            addStyle: {
                border: "none"
            },
            removeProps: []
        }
    }));

    adjustContainer(containerElement, containerSize);

    expect(containerRegistry.get).toHaveBeenCalledTimes(1);
    expect(containerRegistry.get).toHaveBeenCalledWith(containerElement);
    expect(getContainerDimensions).toHaveBeenCalledTimes(0);
    expect(getChangedStyles).toHaveBeenCalledTimes(1);
    expect(getChangedStyles).toHaveBeenCalledWith(
        containerElement,
        containerSize
    );

    // This proves that empty change sets are ignored
    expect(applyStylesToElements).toHaveBeenCalledTimes(2);
    expect(applyStylesToElements).toHaveBeenCalledWith(
        {
            lineHeight: "10px",
            background: "none",
            fontSize: "",
            border: ""
        },
        [containerElement]
    );
    expect(applyStylesToElements).toHaveBeenCalledWith(
        {
            border: "none"
        },
        containerChildren
    );
});