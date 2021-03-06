import React from 'react';

import CommentList from './CommentList';
import SubmissionList from './SubmissionList';

import MainSubmission from './MainSubmission';
import OtherSubmissionsList from './OtherSubmissionsList';


import Challenge from '../challenge/Challenge'
import { Link } from 'react-router';

export default class Record extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      recordInfo: {},
      submissions: [],
      othersubmissions: [],

      comments: [],
      currentUser: "",

      first: {},
      other: [],

      challengeShow: false,
      currentlyShown: {}
    }
  }

  fetchCurrentUser() {
    fetch(`/users/${ localStorage.getItem('user') }`)
      .then((currentUser)=> currentUser.json())
      .then((currentUser)=>{
        this.setState({ currentUser });
    })
  }

  http://localhost:3000/record  ?id=3

{ rid: 2,
 cid : 3 }

  fetchRecordInfo() {
    fetch(`/records/${ this.props.location.query.rid }`)
      .then((recordInfo)=> recordInfo.json())
      .then((recordInfo)=>{
        this.setState({ recordInfo });
        console.log(recordInfo)
    })
  }

  fetchRandomVideos() {
    fetch(`/submissions/except/${ this.props.location.query.rid }`)
      .then((submissions)=> submissions.json())
      .then((submissions)=> {
        let othersubmissions = [];

        if (submissions.length < 6) {
          othersubmissions = submissions.slice()
        } else {
          for (var i = 0; i < 5; i++) {
            let num = this.generateRandomNumber(submissions.length);
            othersubmissions.push(submissions[num])
            submissions.splice(num, 1)
          }
        }

        this.setState({ othersubmissions });
      })

  }

  generateRandomNumber(max) {
    return Math.floor(Math.random() * max);

  }
  fetchVideos() {
    let that = this;
    let toggle = this.props.toggle
    let fetchPath;

    if (this.props.location.query.cid) {
      fetchPath = `/submissions/community?rid=${ this.props.location.query.rid }&cid=${ this.props.location.query.cid }`
    } else {
      fetchPath = `/submissions/${ this.props.location.query.rid }`
    }

    fetch(fetchPath)
      .then((submissions)=> submissions.json())
      .then((submissions)=>{
        this.setState({ submissions });
        return submissions;
      })
      .then((submissions)=>{
        this.setState({ currentlyShown: submissions[0] })
        return submissions;
      })
      .then((submissions)=> {
        that.getDurations();
        return submissions;
      })
      .then((submissions)=> {
        console.log("durations!!!!", this.state.submissions)
        that.sortSubmissions();
      })
  }

  fetchComments(sid) {
    let fetchPath;
    if (this.props.location.query.cid) {
      fetchPath = `/communities/comments?sid=${ sid }&cid=${ this.props.location.query.cid }`
    } else {
      fetchPath = `/comments/${ sid }`
    }
    fetch(fetchPath)
      .then((comments)=> comments.json())
      .then((comments)=>{
        this.setState({ comments });
    })
  }

  getDurations() {
    let submissions = this.state.submissions.slice();
    if (!submissions.length) { return submissions }

    let best = submissions[0].measurement;
    submissions[0].history = 1;
    let history = 2;
    let index = 0;

    for (var i = 0; i < submissions.length; i++) {
      if (submissions[i].measurement > best) {
        let prev = moment(submissions[index].createdAt)
        let updated = moment(submissions[i].createdAt)

        let duration = moment.duration(updated.diff(prev));
        let hours = duration.asHours();
        let days = duration.asDays();


        submissions[index].duration = (hours > 24) ?
          Math.floor(days) + " day(s)" : Math.floor(hours) + " hour(s)"
        submissions[i].history = history;
        history++;
        index = i;
        best = submissions[i].measurement;
      }
    }

    submissions[index].duration = "current winner!"
    this.setState({ submissions })
  }

  sortSubmissions() {
    let more = this.state.recordInfo.moreisgood;
    let submissions = this.state.submissions.slice();

    submissions.sort((a, b) => {
      if (more) {
        if (a.measurement > b.measurement) {
          return -1
        } else {
          return 1
        }
      } else {
        if (a.measurement > b.measurement) {
          return 1
        } else {
          return -1
        }
      }
    })
    this.setState({ submissions })

  }

  getRecordHistory() {
    let submissions = this.state.submissions.slice();

    for (var i = 0; i < submissions.length; i++) {

    }
  }

  toggleChallengeShow() {
    this.setState({ challengeShow: !this.state.challengeShow })
  }

  setMainVideo(submission) {
    this.setState({ currentlyShown: submission })
  }

  componentDidMount() {
    this.fetchRecordInfo();
    this.fetchVideos();
    this.fetchRandomVideos();
    this.fetchCurrentUser();

  }

  render() {
  let mainpage = `/record?rid=${ this.props.location.query.rid }`
  let that = this;
  let path = `/submission?rid=${this.props.location.query.rid}`

  if (this.props.location.query.cid) {path = path + `&cid=${this.props.location.query.cid }`}

    return (
      <div className="indivrecord">
      <center>

        { (this.state.recordInfo.title) ? <div className="title">{ this.state.recordInfo.title }</div> : null }


        { (this.props.location.query.cid) ? <Link to={ mainpage }>
          <button className="submityourown" onClick={ event => window.location.reload() }>Check out the main page for this record!</button>
        </Link> : null }

        <img src='/images/Trophy.png'/>
         { (this.state.submissions[0]) ? <div> The current record to beat is { this.state.submissions[0].measurement } { this.state.recordInfo.units }! <br/> <Link to={ path }><span className="submityourown"> Submit your own video for this record!</span></Link>.</div> : null }


        { (this.state.currentlyShown.Record) ? <MainSubmission
          comments={ this.state.comments }
          fetchComments={ this.fetchComments.bind(this) }
          currentUser={ this.state.currentUser }
          submission={ this.state.currentlyShown }
          record={ this.state.recordInfo }
          cid={ this.props.location.query.cid }
        /> : null }

        <OtherSubmissionsList
          fetchComments={ this.fetchComments.bind(this) }
          submissions={ this.state.submissions }
          othersubmissions={ this.state.othersubmissions }
          setMainVideo={ this.setMainVideo.bind(this) }
        />

      </center>
      </div>
    )
  }
}