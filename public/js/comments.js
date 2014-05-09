/** @jsx React.DOM */

var converter = new Showdown.converter();

var Comment = React.createClass({
  render: function() {
    var rawMarkup = converter.makeHtml(this.props.children.toString());
    return (
      <div className="comment">
        <span className="commentAuthor">
          {this.props.author + " "}
        </span>
        <span className="actualComment" dangerouslySetInnerHTML={{__html: this.props.children.toString()}} />
      </div>
    );
  }
});

// FIND WAY TO COMBINE THIS WITH ABOVE FOR AUTHOR + COMMENT TEXT
var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment, index) {
      return <Comment key={index} author={comment.author}>{comment.text}</Comment>;
    });
    return <div className="commentList">{commentNodes}</div>;
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
      <div className="commentBox">
        <h3>Comments</h3>
        <div className="scrollingPadding">
          <div className="scrollingComments">
            <CommentList data={this.state.data} />
          </div>
          <div className="newCommentPadding">
            <CommentForm onCommentSubmit={this.handleCommentSubmit} />
          </div>
        </div>
      </div>
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
      <form className="pure-form" onSubmit={this.handleSubmit}>
        <input size="30" type="text" placeholder="Say something..." ref="text" />
        <input className="pure-button button-primary" type="submit" value="Post" />
      </form>
    );
  }
});

var myScript = document.getElementById('myScript');
var myId = myScript.parentNode.id;

React.renderComponent(
  <CommentBox url={"/comments/"+myId} pollInterval={2000} />,
  document.getElementById(myId)
);
