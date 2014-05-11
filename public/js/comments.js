var Comment = React.createClass({
  render: function() {
    return (
      React.DOM.div( { className: 'comment' },
        React.DOM.span( { className: 'commentAuthor' },
          this.props.author + ' '
        ),
        React.DOM.span( { className: 'actualComment' },
          this.props.children
        )
      )
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment, index) {
      return (
        Comment( { key: index, author: comment.author },
          comment.text
        )
      );
    });
    return (
     React.DOM.div( { className: 'commentList' },
       commentNodes
     )
   );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      success: function(data) {
        this.setState({data: data});
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    comments.push(comment);
    this.setState({data: comments});
    $.ajax({
      url: this.props.url,
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentWillMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      React.DOM.div( { className: 'commentBox' },
        React.DOM.h3( {}, 'Comments' ),
        React.DOM.div( { className: 'scrollingPadding' },
          React.DOM.div( { className: 'scrollingComments' },
            CommentList( { data: this.state.data } )
          ),
          React.DOM.div( { className: 'newCommentPadding' },
            CommentForm( { onCommentSubmit: this.handleCommentSubmit })
          )
        )
      )
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function() {
    var text = this.refs.text.getDOMNode().value.trim();
    this.props.onCommentSubmit({text: text});
    this.refs.text.getDOMNode().value = '';
    return false;
  },

  render: function() {
    return (
      React.DOM.form( { classname: 'pure-form', onSubmit: this.handleSubmit },
        React.DOM.input( { size: '30', type: 'text', placeholder: 'Say something...', ref: 'text' }),
        React.DOM.input( { className: 'pure-button button-primary', type: 'submit', value: 'Post' })
      )
    );
  }
});

var myScript = document.getElementById('myScript');
var myId = myScript.parentNode.id;

React.renderComponent(
  CommentBox( { url: '/comments/' + myId, pollInterval: 2000 }),
  document.getElementById(myId)
);
