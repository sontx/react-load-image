import * as React from "react";
import classNames from "classnames";
export default class ImageLoader extends React.Component {
    constructor(props) {
        super(props);
        this.state = { status: props.src ? "loading" : "pending" };
        if (React.Children.count(props.children) !== 3)
            throw new Error("wrong # of children provided to ImageLoader");
        this.handleLoad = this.handleLoad.bind(this);
        this.handleError = this.handleError.bind(this);
    }
    createLoader() {
        this.destroyLoader(); // We can only have one loader at a time.
        const img = new Image();
        img.onload = this.handleLoad;
        img.onerror = this.handleError;
        img.src = this.props.src;
        // if srcSet is not passed in then use src for srcset
        // Setting srcset to a non-string is a bad idea. E.g. img.srcset = undefined actually sets srcset to the string "undefined", causing a load failure)
        img.srcset = this.props.srcSet || this.props.src;
        this.img = img;
    }
    destroyLoader() {
        if (this.img) {
            this.img.onload = null;
            this.img.onerror = null;
            this.img = null;
        }
    }
    handleLoad(event) {
        this.destroyLoader();
        this.setState({ status: "loaded" });
        if (this.props.onLoad)
            this.props.onLoad(event);
    }
    handleError(error) {
        this.destroyLoader();
        this.setState({ status: "failed" });
        if (this.props.onError)
            this.props.onError(error);
    }
    componentDidMount() {
        if (this.state.status === "loading") {
            this.createLoader();
        }
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.src !== nextProps.src) {
            this.setState({
                status: nextProps.src ? "loading" : "pending",
            });
        }
    }
    componentDidUpdate() {
        if (this.state.status === "loading" && !this.img) {
            this.createLoader();
        }
    }
    componentWillUnmount() {
        this.destroyLoader();
    }
    render() {
        const { src, srcSet, children, pure, className, style, wrapperProps } = this.props;
        const { status } = this.state;
        const childrenArray = React.Children.toArray(children);
        const extraClassName = classNames(`imageloader imageloader-${status}`, className);
        const extraProps = pure ? Object.assign({ style, className: extraClassName }, wrapperProps) : {};
        const content = (React.createElement(React.Fragment, null,
            status === "loaded" && React.cloneElement(childrenArray[0], Object.assign({ src, srcSet }, extraProps)),
            status === "failed" && React.cloneElement(childrenArray[1], extraProps),
            (status === "loading" || status === "pending") && React.cloneElement(childrenArray[2], extraProps)));
        return pure ? content : (React.createElement("div", Object.assign({}, wrapperProps, { className: extraClassName, style: style }), content));
    }
}
