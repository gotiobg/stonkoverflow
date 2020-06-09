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

function appendQuestion(questionDocument, isFirst){
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
            if(!isFirst){
                let rowDiv = document.createElement('div');
                rowDiv.setAttribute('class', 'row border-top mt-3 mb-3');
                questionsElement.appendChild(rowDiv);
            }

            let rowDiv = document.createElement('div');
            rowDiv.setAttribute('class', 'row');
            questionsElement.appendChild(rowDiv);

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
            timeByDiv.innerHTML = "asked " + getPrintableDate(question.askedTime) + 
                " by&nbsp;<a href='user.html?id=" + userDocument.id + "'>" + 
                userDocument.data().name + "</a>";
            titleTimeByDiv.appendChild(timeByDiv);
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

            var isFirst = true;
            querySnapshot.forEach(function (doc) {
                appendQuestion(doc, isFirst);
                if(isFirst)
                    isFirst = false;
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

                        var isFirst = true;
                        searchResults.forEach(function (doc) {
                            appendQuestion(doc, isFirst);
                            if(isFirst)
                                isFirst = false;
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
                console.log("Document successfully written!");
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
            loginRegisterButtonElement.innerHTML = `<button type="button" class="btn btn-primary mt-1" onclick="logout();">Logout</button>`;
        } else {
            loginRegisterButtonElement.innerHTML = `<button type="button" class="btn btn-primary mt-1" onclick="loginRegister();">Login or Register</button>`;
        }
    });
}

function ask(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            location.href = "ask.html";
        } else {
            loginRegister();
        }
    });
}

function submitQuestion(content){
    const titleElement = document.getElementById('title');

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            let question = new Question(0, "0", "0", "0", titleElement.value, content,
                "", user.uid);

            let titleArray = new Array();
            let questionTitle = question.title.toLowerCase();
            questionTitle = questionTitle.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            titleArray = questionTitle.split(' ');

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
                if (doc.exists) {
                    const titleElement = document.getElementById('title');  
                    const askedTimeByElement = document.getElementById('askedTimeBy');    
                    const votesElement = document.getElementById('votes');    
                    const contentElement = document.getElementById('content');    
                    const commentsElement = document.getElementById('comments');    

                    titleElement.innerHTML = doc.data().title;
                    askedTimeByElement.innerHTML = "Asked " + getPrintableDate(doc.data().askedTime) +
                        " by <a href='user.html?id=" + doc.data().askedBy + "'>" + 
                        userDoc.data().name + "</a> " + 
                        doc.data().votes + " votes " +
                        doc.data().views + " views " +
                        doc.data().answers + " answers ";
                    votesElement.innerHTML = doc.data().votes;
                    contentElement.innerHTML = doc.data().content;

                    questionDocRef.collection('comments').orderBy('time', 'desc').limit(50)
                        .get().then(function (commentsSnapshot) {
                            var isFirst = true;
                            commentsSnapshot.forEach(function (doc) {
                                appendComment(doc, isFirst);
                                if(isFirst)
                                    isFirst = false;
                            });
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

function appendComment(commentDocument, isFirst){
    // <div class="row">
    //     <div class="col-1">
    //         <div class="row justify-content-center">
    //         <a href="#"><img src="images/upvote_gray.png" onclick="upvote();" /></a>
    //         </div>
    //         <div id="votes" class="row justify-content-center mt-2 mb-2">
    //         </div>
    //         <div class="row justify-content-center">
    //         <a href="#"><img src="images/downvote_gray.png" onclick="downvote();" /></a>
    //         </div>
    //     </div>
    //     <div id="content" class="col">
    //         <div class="row">
    //         </div>
    //         <div class="row">
    //         </div>
    //     </div>
    // </div>
    
    const commentsElement = document.getElementById('comments');

    var userReference = firestore.collection('users').doc(commentDocument.data().userId);
    userReference.get().then(function(userDocument){
        if(userDocument.exists){
            let rowDiv = document.createElement('div');
            if(!isFirst)
                rowDiv.setAttribute('class', 'row border-top mt-3 mb-3');
            else
                rowDiv.setAttribute('class', 'row');
            commentsElement.appendChild(rowDiv);

            return;
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
            timeByDiv.innerHTML = "asked " + getPrintableDate(question.askedTime) + 
                " by&nbsp;<a href='user.html?id=" + userDocument.id + "'>" + 
                userDocument.data().name + "</a>";
            titleTimeByDiv.appendChild(timeByDiv);
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}