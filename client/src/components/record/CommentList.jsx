import React from 'react';
import CommentEntry from './CommentEntry';

export default class CommentList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      testcomments : [ { key: 1, title: 'Comment1', comment: 'This is comment #1. Blah, blah blah, blah', user: 'CoastalCode'}, { key: 2, title: 'Comment2', comment: 'This is comment #2. Blah, blah blah, blah', user: 'CC'} ],
      nextKey: 3,
      newTitle: "",
      newDescription: "",
      comments: []
    }

  }

  fetchComments() {
    let init = {
      method: 'GET',
      headers: new Headers()
    }

    fetch(`/comments/${ this.props.submission.id }`)
      .then((comments)=> comments.json())
      .then((comments)=>{
        this.setState({ comments });
        console.log(comments)
    })
  }

  postComment(comment) {
    return fetch('/comments/', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'post',
        body: JSON.stringify(comment)
    }).then(function(response) {
        console.log(response);
    })
  }

  componentDidMount() {
    this.fetchComments();
  }

  addComment(title, description) {
    let comment = {
      title: title,
      description: description,
      userId: this.props.currentUser.id,
      submissionId: this.props.submission.id
    }
    console.log("comment to be added", comment)
    this.postComment(comment)
    .then((data)=> this.fetchComments());
  }

  render() {
    return (
      <div className="commentList">
        { this.state.comments.map((comment) => <CommentEntry key={ comment.id } comment={ comment }/>) }
        <br/>
        <input placeholder="title" onChange={ event => this.setState({ newTitle: event.target.value}) } />
        <br/>
        <input placeholder="comment" onChange={ event => this.setState({ newDescription: event.target.value}) } />
        <br/>
        <button onClick={ event =>{ this.addComment(this.state.newTitle, this.state.newDescription) }}>
          Add a comment!
        </button>
      </div>
    )
  }
}