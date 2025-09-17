import React from "react"

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, err: null }
  static getDerivedStateFromError(err){ return { hasError: true, err } }
  componentDidCatch(err, info){ console.error("App crash:", err, info) }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{padding:16}}>
          <h2 style={{marginBottom:8}}>Something broke</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.err)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
