// This file is used to upload videos to Youtube
// The majority of this file was the original example from youtube
// but some modifications have been made to write the submission to the database

/*
Copyright 2015 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var signinCallback = function (result){
  if(result.access_token) {
    var uploadVideo = new UploadVideo();
    uploadVideo.ready(result.access_token);
  }
};

var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.


/**
 * YouTube video uploader class
 *
 * @constructor
 */
var UploadVideo = function() {
  /**
   * The array of tags for the new YouTube video.
   *
   * @attribute tags
   * @type Array.<string>
   * @default ['google-cors-upload']
   */
  this.tags = ['youtube-cors-upload'];

  /**
   * The numeric YouTube
   * [category id](https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.videoCategories.list?part=snippet&regionCode=us).
   *
   * @attribute categoryId
   * @type number
   * @default 22
   */
  this.categoryId = 22;

  /**
   * The id of the new video.
   *
   * @attribute videoId
   * @type string
   * @default ''
   */
  this.videoId = '';

  this.uploadStartTime = 0;
};


UploadVideo.prototype.ready = function(accessToken) {
  this.accessToken = accessToken;
  this.gapi = gapi;
  this.authenticated = true;
  this.gapi.client.request({
    path: '/youtube/v3/channels',
    params: {
      part: 'snippet',
      mine: true
    },
    callback: function(response) {
      if (response.error) {
        console.log(response.error.message);
      } else {
        $('#channel-name').text(response.items[0].snippet.title);
        $('#channel-thumbnail').attr('src', response.items[0].snippet.thumbnails.default.url);

        $('.pre-sign-in').hide();
        $('.post-sign-in').show();
      }
    }.bind(this)
  });
  $('#button').on("click", this.handleUploadClicked.bind(this));
};

/**
 * Uploads a video file to YouTube.
 *
 * @method uploadFile
 * @param {object} file File object corresponding to the video to upload.
 */
UploadVideo.prototype.uploadFile = function(file) {
  // grabs recordId and communityId from url
  var searchParams = window.location.search.slice(1);
  if (searchParams.length > 0) {
    searchParams = searchParams.split('&');
    var recordIdQuery = searchParams[0].replace(/\D*/,'');
    var communityIdQuery = null;
    if (searchParams.length > 1) {
      var communityIdQuery = searchParams[1].replace(/\D*/,'');
    }
  } else {
    var recordIdQuery = null;
    var communityIdQuery = null;
  }

  // grabs other items from the submission page
  var uploadTitle = $('#title').val();
  var uploadDescription = $('#description').val();
  var selectedCategory = $('#selectedCategory').text();
  var selectedSubCategory = $('#selectedSubCategory').text();
  var measurement = $('#measurement').val();
  var units = $('#units').val();
  var CommunityId = communityIdQuery || $('input[name=community]:checked').val();
  var RecordId = recordIdQuery;
  var recordName = $('#recordName').val();

  // more and less isgood is an integer value representing 0 for false and 1 for true
  // if more is the true value, that means larger measurements are needed to set a new record
  if ($('#measurement-direction').val() === 'lower') {
    var moreisgood = 0;
    var lessisgood = 1;
  } else {
    var moreisgood = 1;
    var lessisgood = 0;
  }

  // isPublic is an integer value representing 0 for false and 1 for true
  // if isPublic is true, then the whole site can see the video submission
  // if isPublic is false, then only the community this record is associated
  // with can see it
  if ($('#check_public').is(":checked")) {
    var isPublic = 0;
  } else {
    var isPublic = 1;
  }

  // metadata is what is sent to youtube
  // title and description comes from the submission page
  // the description has an ending to add a link to wechallenge
  var metadata = {
    snippet: {
      title: uploadTitle,
      description: uploadDescription + "\n\nThis video was submitted as part of the http://wechallenge.heroku.com project",
      tags: this.tags,
      categoryId: this.categoryId
    },
    status: {
      privacyStatus: $('#privacy-status option:selected').text()
    }
  };
  var uploader = new MediaUploader({
    baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
    file: file,
    token: this.accessToken,
    metadata: metadata,
    params: {
      part: Object.keys(metadata).join(',')
    },
    onError: function(data) {
      var message = data;
      // Assuming the error is raised by the YouTube API, data will be
      // a JSON string with error.message set. That may not be the
      // only time onError will be raised, though.
      try {
        var errorResponse = JSON.parse(data);
        message = errorResponse.error.message;
      } finally {
        alert(message);
      }
    }.bind(this),
    onProgress: function(data) {
      var currentTime = Date.now();
      var bytesUploaded = data.loaded;
      var totalBytes = data.total;
      // The times are in millis, so we need to divide by 1000 to get seconds.
      var bytesPerSecond = bytesUploaded / ((currentTime - this.uploadStartTime) / 1000);
      var estimatedSecondsRemaining = (totalBytes - bytesUploaded) / bytesPerSecond;
      var percentageComplete = (bytesUploaded * 100) / totalBytes;

      $('#upload-progress').attr({
        value: bytesUploaded,
        max: totalBytes
      });

      $('#percent-transferred').text(percentageComplete);
      $('#bytes-transferred').text(bytesUploaded);
      $('#total-bytes').text(totalBytes);

      $('.during-upload').show();
    }.bind(this),
    onComplete: function(data) {
      var uploadResponse = JSON.parse(data);
      this.videoId = uploadResponse.id;
      $('#video-id').text(this.videoId);
      // Updates wechallenge Database with submission
      $.ajax({
        method: "POST",
        url: "/submissions",
        data: JSON.stringify({
          "submissionTitle": uploadTitle,
          "description": uploadDescription,
          "link": this.videoId,
          "userId": Number(localStorage.user),
          "selectedCategory": selectedCategory,
          "selectedSubCategory": selectedSubCategory,
          "measurement": measurement,
          "units": units,
          "moreisgood": moreisgood,
          "lessisgood": lessisgood,
          "state": localStorage.region,
          "public": isPublic,
          "CommunityId": CommunityId,
          "recordId": RecordId,
          "recordName": recordName
        })
      })
        .done(function(msg) {
          // redirects back to the homepage after successful upload
          document.location.search = '';
          document.location.pathname ='/';
        })
        .fail(function(msg) {
          console.log('fail msg: ', msg);
        });
      $('.post-upload').show();
      this.pollForVideoStatus();
    }.bind(this)
  });
  // This won't correspond to the *exact* start of the upload, but it should be close enough.
  this.uploadStartTime = Date.now();
  uploader.upload();
};

UploadVideo.prototype.handleUploadClicked = function() {
  $('#button').attr('disabled', true);
  this.uploadFile($('#file').get(0).files[0]);
};

UploadVideo.prototype.pollForVideoStatus = function() {
  this.gapi.client.request({
    path: '/youtube/v3/videos',
    params: {
      part: 'status,player',
      id: this.videoId
    },
    callback: function(response) {
      if (response.error) {
        // The status polling failed.
        console.log(response.error.message);
        setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
      } else {
        var uploadStatus = response.items[0].status.uploadStatus;
        switch (uploadStatus) {
          // This is a non-final status, so we need to poll again.
          case 'uploaded':
            $('#post-upload-status').append('<li>Upload status: ' + uploadStatus + '</li>');
            setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
            break;
          // The video was successfully transcoded and is available.
          case 'processed':
            $('#player').append(response.items[0].player.embedHtml);
            $('#post-upload-status').append('<li>Final status.</li>');
            break;
          // All other statuses indicate a permanent transcoding failure.
          default:
            $('#post-upload-status').append('<li>Transcoding failed.</li>');
            break;
        }
      }
    }.bind(this)
  });
};
