// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAhs4Ugm5QtM32l26v4Uijias_GofJ-3yc",
    authDomain: "stonkoverflow.firebaseapp.com",
    databaseURL: "https://stonkoverflow.firebaseio.com",
    projectId: "stonkoverflow",
    storageBucket: "stonkoverflow.appspot.com",
    messagingSenderId: "911990920857",
    appId: "1:911990920857:web:beed4bb135361320068a08",
    measurementId: "G-61N5THWPLZ"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
// firebase.firestore().settings({ experimentalForceLongPolling: true });
const firestore = firebase.firestore();

var provider = new firebase.auth.GoogleAuthProvider();

//////////////////////////////////////////////////
// Classes

class User {
    constructor(id, name, karma){
        this.id = id;
        this.name = name;
        this.karma = karma;
    }
}

class Question {
    constructor(id, votes, answers, views, title, content, askedTime, askedBy){
        this.id = id;
        this.votes = votes;
        this.answers = answers;
        this.views = views;
        this.title = title;
        this.content = content;
        this.askedTime = askedTime;
        this.askedBy = askedBy;
    }
}

class Comment {
    constructor(id, questionId, userId, votes, content, time){
        this.id = id;
        this.questionId = questionId;
        this.userId = userId;
        this.votes = votes;
        this.content = content;
        this.time = time;
    }
}

//////////////////////////////////////////////////
// Functions

function getPrintableDate(timestamp){
    var date = timestamp.toDate(); // Firestore.Timestamp -> JS.Date
    return ('0' + date.getDate()).slice(-2) +
        '.' +
        ('0' + date.getMonth()).slice(-2) +
        '.' +
        date.getFullYear();
}

function getPrintableDatetime(timestamp){
    var date = timestamp.toDate(); // Firestore.Timestamp -> JS.Date

    return (
        date.getHours() +
        ':' +
        ('0' + date.getMinutes()).slice(-2) +
        ' ' +
        ('0' + date.getDate()).slice(-2) +
        '.' +
        ('0' + date.getMonth()).slice(-2) +
        '.' +
        date.getFullYear() 
        );
}

function appendQuestion(questionDocument, index){
    //  <div class="row">
    //      <div class="col-1 text-center text-wrap">0<br>votes</div>
    //      <div class="col-1 text-center text-wrap">1<br>answers</div>
    //      <div class="col-1 text-center text-wrap">2<br>views</div>
    //      <div class="col-9">
    //          <div class="row">
    //              Checkout new brach from master with remote Android Studio 4.0
    //          </div>
    //          <div class="row justify-content-end">
    //              asked 1 min ago Caio Faustino 163
    //          </div>
    //      </div>
    //  </div>
    //  <div class="row border-top mt-3 mb-3">
    //  </div>

    const questionsElement = document.getElementById('questions');
    const question = new Question(questionDocument.id, questionDocument.data().votes, 
        questionDocument.data().answers, questionDocument.data().views, 
        questionDocument.data().title, questionDocument.data().content, 
        questionDocument.data().askedTime, questionDocument.data().askedBy);

    var userReference = firestore.collection('users').doc(question.askedBy);
    userReference.get().then(function(userDocument){
        if(userDocument.exists){
            let rowDiv = document.createElement('div');
            rowDiv.setAttribute('class', 'row');

            let votesDiv = document.createElement('div');
            votesDiv.setAttribute('class', 'col-1 text-center text-wrap');
            votesDiv.innerHTML = question.votes + "<br>votes";
            rowDiv.appendChild(votesDiv);

            let answersDiv = document.createElement('div');
            answersDiv.setAttribute('class', 'col-1 text-center text-wrap');
            answersDiv.innerHTML = question.answers + "<br>answers";
            rowDiv.appendChild(answersDiv);

            let viewsDiv = document.createElement('div');
            viewsDiv.setAttribute('class', 'col-1 text-center text-wrap');
            viewsDiv.innerHTML = question.views + "<br>views";
            rowDiv.appendChild(viewsDiv);

            let titleTimeByDiv = document.createElement('div');
            titleTimeByDiv.setAttribute('class', 'col-9');
            rowDiv.appendChild(titleTimeByDiv);

            let titleDiv = document.createElement('div');
            titleDiv.setAttribute('class', 'row');
            titleDiv.innerHTML = "<a href='question.html?id=" + question.id + "'>" + 
                question.title + "</a>";
            titleTimeByDiv.appendChild(titleDiv);

            let timeByDiv = document.createElement('div');
            timeByDiv.setAttribute('class', 'row justify-content-end');
            timeByDiv.innerHTML = "asked " + getPrintableDatetime(question.askedTime) + 
                " by&nbsp;<a href='user.html?id=" + userDocument.id + "'>" + 
                userDocument.data().name + "</a>";
            titleTimeByDiv.appendChild(timeByDiv);

            questionsElement.childNodes[index].replaceWith(rowDiv);
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function loadQuestions(searchText){
    if(searchText == undefined || searchText == ""){
        firestore.collection('questions').orderBy('askedTime', 'desc').limit(50)
        .get().then(function (querySnapshot) {
            const questionsElement = document.getElementById('questions');
            questionsElement.innerHTML = "";

            querySnapshot.forEach(function(doc){
                var lineDivElement = document.createElement('div');
                lineDivElement.setAttribute('class', 'row border-top mt-3 mb-3');
                questionsElement.appendChild(lineDivElement);

                var divElement = document.createElement('div');
                divElement.setAttribute('class', 'row');
                questionsElement.appendChild(divElement);
            });

            let index = 1;
            querySnapshot.forEach(function (doc) {
                appendQuestion(doc, index);
                index = index + 2;
            });
        });
    } else {
        searchText = searchText.toLowerCase();

        firestore.collection('questions').orderBy('askedTime', 'desc').limit(50)
            .where("titleArray", "array-contains-any", searchText.split(' '))
            .get().then(function (titleQuerySnapshot) {
                firestore.collection('questions').orderBy('askedTime', 'desc').limit(50)
                    .where("contentArray", "array-contains-any", searchText.split(' '))
                    .get().then(function (contentQuerySnapshot) {
                        const questionsElement = document.getElementById('questions');
                        questionsElement.innerHTML = "";

                        let searchResults = new Array();
                        titleQuerySnapshot.forEach(function(doc){
                            searchResults.push(doc);
                        });

                        let found = false;
                        contentQuerySnapshot.forEach(function(contentDoc){
                            titleQuerySnapshot.forEach(function(titleDoc){
                                if(titleDoc.id != contentDoc.id)
                                    return;

                                found = true;
                            });
                            
                            if(!found)
                                searchResults.push(contentDoc);
                        });

                        searchResults.forEach(function(doc){
                            var lineDivElement = document.createElement('div');
                            lineDivElement.setAttribute('class', 'row border-top mt-3 mb-3');
                            questionsElement.appendChild(lineDivElement);
            
                            var divElement = document.createElement('div');
                            divElement.setAttribute('class', 'row');
                            questionsElement.appendChild(divElement);
                        });
            
                        let index = 1;
                        searchResults.forEach(function (doc) {
                            appendQuestion(doc, index);
                            index = index + 2;
                        });
                    });
            });
    }
}

function search(){
    const searchElement = document.getElementById('searchInput');
    const searchText = searchElement.value;

    loadQuestions(searchText)

    return false;
}

function loginRegister(){
    firebase.auth().signInWithPopup(provider).then(function(result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;
            // ...

            let userRecord = new User(user.uid, user.displayName, 0);
            
            firestore.collection("users").doc(userRecord.id).set({
                name: userRecord.name,
            }, { merge: true })
            .then(function() {
                location.reload();
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
            });
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
            console.log(error)
        });
}

function logout(){
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        location.reload();
    }, function(error) {
        // An error happened.
    });
}

function setLoginRegisterButton(){
    const loginRegisterButtonElement = document.getElementById('loginRegisterButton');
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loginRegisterButtonElement.innerHTML = `<button type="button" class="btn btn-primary mt-1 mb-2" onclick="logout();">Logout</button>`;
        } else {
            loginRegisterButtonElement.innerHTML = `<button type="button" class="btn btn-primary mt-1 mb-2" onclick="loginRegister();">Login or Register</button>`;
        }
    });
}

function ask(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            location.href = "ask.html";
        } else {
            alert("You have to be logged in to ask a question.");
        }
    });
}

function submitQuestion(content){
    const submitButtonElement = document.getElementById("submitButton");
    const errorTextElement = document.getElementById("errorText");
    submitButtonElement.classList.add("disabled");
    submitButtonElement.setAttribute("disabled", true);

    const titleElement = document.getElementById('title');

    // Validations
    let errorText = "";

    if(titleElement.value.length < 15)
        errorText += "Title must be " + ( 15 - titleElement.value.length ) + " more symbol(s).";

    if(content.length < 100){
        if(errorText.length > 0)
            errorText += "\n";
        errorText += "Content must be " + ( 100 - content.length ) + " more symbol(s).";
    }

    if(errorText.length > 0){
        // alert(errorText);
        errorTextElement.innerHTML = errorText;
        submitButtonElement.classList.remove("disabled");
        submitButtonElement.removeAttribute("disabled");
        return;
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            let question = new Question(0, "0", "0", "0", titleElement.value, content,
                "", user.uid);

            let titleArray = new Array();
            let questionTitle = question.title.toLowerCase();
            questionTitle = questionTitle.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            titleArray = questionTitle.split(' ');
            // todo make 1, 2, 3... letter splits

            let contentArray = new Array();
            let questionContent = question.content.toLowerCase();
            questionContent = questionContent.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            contentArray = questionContent.split(' ');

            firestore.collection("questions").add({
                votes: question.votes,
                answers: question.answers,
                views: question.views,
                title: question.title,
                content: question.content,
                askedTime: firebase.firestore.FieldValue.serverTimestamp(),
                askedBy: question.askedBy,
                titleArray: titleArray,
                contentArray: contentArray,
            })
            .then(function(questionReference) {
                console.log("Document successfully written!");
                location.href = "question.html?id=" + questionReference.id;
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
            });
        } else {
            alert("You have to be logged in to submit a question.");
        }
    });
}

function loadQuestion(){
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');
    if(questionId == undefined || questionId == null)
        location.href = "index.html";
    
    let questionDocRef = firestore.collection('questions').doc(questionId);
    questionDocRef.get().then(function (doc) {
        if (doc.exists) {
            firestore.collection('users').doc(doc.data().askedBy).get().then(function (userDoc) {
                if (userDoc.exists) {
                    const titleElement = document.getElementById('title');  
                    const askedTimeByElement = document.getElementById('askedTimeBy');    
                    const votesElement = document.getElementById('votes');    
                    const contentElement = document.getElementById('content');
                    contentElement.innerHTML = "<textarea id='questionContent'></textarea>"; 

                    titleElement.innerHTML = doc.data().title;
                    askedTimeByElement.innerHTML = "Asked " + getPrintableDatetime(doc.data().askedTime) +
                        " by <a href='user.html?id=" + doc.data().askedBy + "'>" + 
                        userDoc.data().name + "</a> " + 
                        doc.data().votes + " votes " +
                        ( parseInt(doc.data().views) + 1 ) + " views " +
                        doc.data().answers + " answers ";
                    votesElement.innerHTML = doc.data().votes;
                    let contentMDE = new SimpleMDEPreview({ 
                        element: document.getElementById("questionContent"),
                        initialValue: doc.data().content,
                        // toolbar: false,
                        spellChecker: false,
                    });   
                    contentMDE.togglePreview();

                    questionDocRef.collection('comments').orderBy('votes', 'desc')
                        .orderBy('time', 'asc')
                        .get().then(function (commentsSnapshot) {
                            commentsSnapshot.forEach(function (doc) {
                                appendComment(doc);
                            });
                        });

                    document.cookie = questionId;

                    // Increase view count
                    firestore.collection("questions").doc(questionId).set({
                        views: parseInt(doc.data().views) + 1,
                    }, { merge: true })
                    .catch(function(error) {
                        console.error("Error increasing view count: ", error);
                    });

                    // Changing arrow colors

                    firestore.collection('questions').doc(questionId).collection('votes').doc(userDoc.id)
                        .get().then(function(questionUserVoteDocument) {
                            if(questionUserVoteDocument.exists){
                                const upvoteElement = document.getElementById('upvote');
                                const downvoteElement = document.getElementById('downvote');
            
                                if(questionUserVoteDocument.data().vote == 1){
                                    upvoteElement.setAttribute('src', 'images/upvote_orange.png');
                                    downvoteElement.setAttribute('src', 'images/downvote_gray.png');
                                } else if(questionUserVoteDocument.data().vote == 0){
                                    upvoteElement.setAttribute('src', 'images/upvote_gray.png');
                                    downvoteElement.setAttribute('src', 'images/downvote_gray.png');
                                } else if(questionUserVoteDocument.data().vote == -1){
                                    upvoteElement.setAttribute('src', 'images/upvote_gray.png');
                                    downvoteElement.setAttribute('src', 'images/downvote_orange.png');
                                }
                            }
                        });
                } else {
                    location.href = "index.html";
                }
            });
        } else {
            location.href = "index.html";
        }
    });
}

function appendComment(commentDocument){
    const commentsElement = document.getElementById('comments');

    var userReference = firestore.collection('users').doc(commentDocument.data().userId);
    userReference.get().then(function(userDocument){
        if(userDocument.exists){
            const commentId = "comment" + commentDocument.id;

            commentsElement.innerHTML = commentsElement.innerHTML +
                "<div class='row border-top mt-3 mb-3'>" +
                "</div>" +
                "<div class='row'>" +
                "    <div class='col-1'>" +
                "        <div class='row justify-content-center'>" +
                "        <a href='#voteComment'><img id='upvote" + commentDocument.id + "' src='images/upvote_gray.png' onclick='voteComment(\"" + commentDocument.id + "\", true);' /></a>" +
                "        </div>" +
                "        <div id='votes" + commentDocument.id + "' class='row justify-content-center mt-2 mb-2'>" +
                commentDocument.data().votes +
                "        </div>" +
                "        <div class='row justify-content-center'>" +
                "        <a href='#voteComment'><img id='downvote" + commentDocument.id + "' src='images/downvote_gray.png' onclick='voteComment(\"" + commentDocument.id + "\", false);' /></a>" +
                "        </div>" +
                "    </div>" +
                "    <div id='content' class='col-11 justify-content-between'>" +
                "        <div class='row ml-1'>" +
                "           <div class='col'>" +
                "               <textarea id='" + commentId + "'></textarea>" +
                "           </div>" +
                "        </div>" +
                "        <div class='row mr-1'>" +
                "           <div class='col text-right'>" +
                "               <a href='user.html?id=" + commentDocument.data().userId + "'>" + userDocument.data().name + "</a>&nbsp;" + 
                getPrintableDatetime(commentDocument.data().time) + 
                "           </div>" +
                "        </div>" +
                "    </div>" +
                "</div>";

                setTimeout(function(){
                    let simpleMDE = new SimpleMDEPreview({ 
                        element: document.getElementById(commentId),
                        initialValue: commentDocument.data().content,
                        toolbar: false,
                        spellChecker: false,
                        status: false,
                        lineWrapping: false,
                    });
                    simpleMDE.togglePreview();
                }, 100);
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function submitComment(comment){
    const submitButtonElement = document.getElementById("submitButton");
    const errorTextElement = document.getElementById("errorText");
    submitButtonElement.classList.add("disabled");
    submitButtonElement.setAttribute("disabled", false);

    // Validations
    let errorText = "";
    if(comment.length < 50){
        errorText = "Comment must be " + ( 50 - comment.length ) + " more symbol(s).";
    }

    if(errorText.length > 0){
        errorTextElement.innerHTML = errorText;
        submitButtonElement.classList.remove("disabled");
        submitButtonElement.removeAttribute("disabled");
        return;
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            const questionId = document.cookie;
            const commentObject = new Comment(0, questionId, user.uid, 0, comment, "");

            firestore.collection('questions').doc(questionId).get().then(function (doc) {
                if (doc.exists) {
                    firestore.collection("questions").doc(questionId).set({
                        answers: parseInt(doc.data().answers) + 1,
                    }, { merge: true })
                    .catch(function(error) {
                        console.error("Error increasing comment count: ", error);
                    });

                    // todo last action

                    firestore.collection('questions').doc(questionId).collection('comments').add({
                        questionId: commentObject.questionId,
                        userId: commentObject.userId,
                        votes: commentObject.votes,
                        content: commentObject.content,
                        time: firebase.firestore.FieldValue.serverTimestamp(),
                    })
                    .then(function(questionReference) {
                        location.reload();
                    })
                    .catch(function(error) {
                        console.error("Error writing document: ", error);
                    });
                }
            });
        } else {
            alert("You have to be logged in to comment.");
        }
    });
}

function vote(isUpvote){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            const questionId = document.cookie;
            firestore.collection('questions').doc(questionId).collection('votes').doc(user.uid)
                .get().then(function(doc) {
                    let newVote = 0;
                    let newVoteQuestion = 0;

                    if (doc.exists) {
                        if(isUpvote && doc.data().vote == 1) {
                            newVote = 0;
                            newVoteQuestion = -1;
                        } else if(isUpvote && doc.data().vote == 0) {
                            newVote = 1;
                            newVoteQuestion = 1;
                        } else if(isUpvote && doc.data().vote == -1) {
                            newVote = 1;
                            newVoteQuestion = 2;
                        } else if(!isUpvote && doc.data().vote == 1){
                            newVote = -1;
                            newVoteQuestion = -2;
                        } else if(!isUpvote && doc.data().vote == 0){
                            newVote = -1;
                            newVoteQuestion = -1;
                        } else if(!isUpvote && doc.data().vote == -1){
                            newVote = 0;
                            newVoteQuestion = 1;
                        }
                    } else {
                        newVote = isUpvote ? 1 : -1
                        newVoteQuestion = isUpvote ? 1 : -1;
                    }

                    // Changes user vote for question
                    firestore.collection("questions").doc(questionId).collection('votes').doc(user.uid).set({
                        vote: newVote,
                    })
                    .catch(function(error) {
                        console.error("Error voting for question: ", error);
                    });

                    // Changes question votes
                    firestore.collection("questions").doc(questionId)
                        .get().then(function(questionDocument) {
                            const newVotes = parseInt(questionDocument.data().votes) + newVoteQuestion;
                            if (questionDocument.exists){
                                firestore.collection("questions").doc(questionId).set({
                                    votes: newVotes,
                                }, { merge: true })
                                .catch(function(error) {
                                    console.error("Error voting for question: ", error);
                                });

                                const votesElement = document.getElementById('votes');
                                votesElement.innerHTML = newVotes;
                            }
                        })
                        .catch(function(error) {
                            console.error("Error voting for question: ", error);
                        });

                    // Changing arrow colors
                    const upvoteElement = document.getElementById('upvote');
                    const downvoteElement = document.getElementById('downvote');

                    if(newVote == 1){
                        upvoteElement.setAttribute('src', 'images/upvote_orange.png');
                        downvoteElement.setAttribute('src', 'images/downvote_gray.png');
                    } else if(newVote == 0){
                        upvoteElement.setAttribute('src', 'images/upvote_gray.png');
                        downvoteElement.setAttribute('src', 'images/downvote_gray.png');
                    } else if(newVote == -1){
                        upvoteElement.setAttribute('src', 'images/upvote_gray.png');
                        downvoteElement.setAttribute('src', 'images/downvote_orange.png');
                    }
            });
        } else {
            alert("You have to be logged in to comment.");
        }
    });
}

function voteComment(commentDocumentId, isUpvote){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user){
            const questionId = document.cookie;

            firestore.collection('questions').doc(questionId)
                .collection('comments').doc(commentDocumentId)
                .collection('votes').doc(user.uid)
                .get().then(function(doc) {
                    let newVote = 0;
                    let newVoteComment = 0;

                    if (doc.exists) {
                        if(isUpvote && doc.data().vote == 1) {
                            newVote = 0;
                            newVoteComment = -1;
                        } else if(isUpvote && doc.data().vote == 0) {
                            newVote = 1;
                            newVoteComment = 1;
                        } else if(isUpvote && doc.data().vote == -1) {
                            newVote = 1;
                            newVoteComment = 2;
                        } else if(!isUpvote && doc.data().vote == 1){
                            newVote = -1;
                            newVoteComment = -2;
                        } else if(!isUpvote && doc.data().vote == 0){
                            newVote = -1;
                            newVoteComment = -1;
                        } else if(!isUpvote && doc.data().vote == -1){
                            newVote = 0;
                            newVoteComment = 1;
                        }
                    } else {
                        newVote = isUpvote ? 1 : -1
                        newVoteComment = isUpvote ? 1 : -1;
                    }

                    // Changes user vote for comment
                    firestore.collection('questions').doc(questionId)
                        .collection('comments').doc(commentDocumentId)
                        .collection('votes').doc(user.uid)
                        .set({
                        vote: newVote,
                    })
                    .catch(function(error) {
                        console.error("Error voting for question: ", error);
                    });

                    // Changes question votes
                    firestore.collection('questions').doc(questionId)
                        .collection('comments').doc(commentDocumentId)
                        .get().then(function(commentDocument) {
                            const newVotes = parseInt(commentDocument.data().votes) + newVoteComment;
                            if (commentDocument.exists){
                                firestore.collection("questions").doc(questionId)
                                    .collection('comments').doc(commentDocumentId)
                                    .set({
                                    votes: newVotes,
                                }, { merge: true })
                                .catch(function(error) {
                                    console.error("Error voting for question: ", error);
                                });

                                const votesElement = document.getElementById('votes' + commentDocumentId);
                                votesElement.innerHTML = newVotes;
                            }
                        })
                        .catch(function(error) {
                            console.error("Error voting for question: ", error);
                        });

                    // Changing arrow colors
                    const upvoteElement = document.getElementById('upvote' + commentDocumentId);
                    const downvoteElement = document.getElementById('downvote' + commentDocumentId);

                    if(newVote == 1){
                        upvoteElement.setAttribute('src', 'images/upvote_orange.png');
                        downvoteElement.setAttribute('src', 'images/downvote_gray.png');
                    } else if(newVote == 0){
                        upvoteElement.setAttribute('src', 'images/upvote_gray.png');
                        downvoteElement.setAttribute('src', 'images/downvote_gray.png');
                    } else if(newVote == -1){
                        upvoteElement.setAttribute('src', 'images/upvote_gray.png');
                        downvoteElement.setAttribute('src', 'images/downvote_orange.png');
                    }
            });
        } else {
            alert("You have to be logged in to comment.");
        }
    });
}

function loadUser(){
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    if(userId == undefined || userId == null)
        location.href = "index.html";

    const userNameElement = document.getElementById('userName');

    firestore.collection('users').doc(userId).get().then(function(userDocument){
        if(userDocument.exists){
            userNameElement.innerHTML = userDocument.data().name;
        }
    });
}