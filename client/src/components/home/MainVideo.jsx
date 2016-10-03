import React from 'react';
import Video from './Video';
import YouTube from 'react-youtube';
import VideoActions from './VideoActions';

export default class MainVideo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasUserVote: false
    };
  }

  componentDidMount() {
      this.fetchTopVideo();
  }

  fetchTopVideo() {
    let headers = new Headers();
    let init = {
      method: 'GET',
      headers: headers
    }
    let jprom = fetch('/records', init).then(res => res.json())
    jprom.then((data)=>{
      // console.log('data', data)
    })
  }

  render() {
    const opts = {
      height: '349',
      width: '560'
    }
    return (
      <div>
        <h1 className="home-header mainHeader">weChallenge of the Day: {this.props.video.title}</h1>
        <div className="video-container">
          <YouTube videoId={this.props.video.link}
            opts={opts}
          />
        </div>
        <VideoActions subId={this.props.video.id} link={this.props.video.link} votes={this.props.video.votes} comments={this.props.video.comments} />
      </div>
    )
  }

}