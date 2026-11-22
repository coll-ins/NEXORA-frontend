import { Component } from 'react';
import ErrorPage from '../components/ErrorPage.jsx';

export default class PageBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed
      ? <ErrorPage code="500" onAction={this.props.onAction} />
      : this.props.children;
  }
}
