App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  hasVoted: false,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (window.web3) {
      // Specify default instance if no web3 instance provided
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://127.0.0.1:7545"
      );
    }

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Election.json", function (election) {
      App.contracts.Election = TruffleContract(election);

      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      App.listenForAccountChange();

      return App.render();
    });
  },

  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      instance
        .votedEvent(
          {},
          {
            fromBlock: "latest",
            toBlock: "latest",
          }
        )
        .watch(function (error, event) {
          console.log("event triggered", event);
          App.render();
        });
    });
  },

  listenForAccountChange: function () {
    ethereum.on("accountsChanged", function (accounts) {
      App.account = accounts[0];
      App.render();
    });
  },

  render: function () {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    App.contracts.Election.deployed()
      .then(function (instance) {
        electionInstance = instance;
        return electionInstance.candidatesCount();
      })
      .then(function (candidatesCount) {
        var candidatesResults = $("#candidatesResults");
        candidatesResults.empty();

        var candidatesSelect = $("#candidatesSelect");
        candidatesSelect.empty();

        // Add candidates using the addCandidate function
        App.addCandidate(1, "Divyansh Jaiswal", "BJP", 0);
        App.addCandidate(2, "Chaitrali Kulkarni", "AAP", 0);
        App.addCandidate(3, "Manaswi Chiwande", "INC", 0);
        App.addCandidate(4, "Abhinav Raj", "BSP", 0);

        // Retrieve and append the remaining candidates
        for (var i = 1; i <= candidatesCount; i++) {
          electionInstance.candidates(i).then(function (candidate) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[3];
            var party = candidate[2];
            App.addCandidate(id, name, party, voteCount);
          });
        }

        loader.hide();
        content.show();
      })
      .catch(function (error) {
        console.error(error);
        loader.hide();
        content.show();
      });
  },

  addCandidate: function (id, name, party, voteCount) {
    var candidatesResults = $("#candidatesResults");
    var candidatesSelect = $("#candidatesSelect");

    // Append the new candidate to the results table
    var candidateTemplate = `<tr><th>${id}</th><td>${name}</td><td>${party}</td><td>${voteCount}</td></tr>`;
    candidatesResults.append(candidateTemplate);

    // Add the new candidate to the select dropdown
    var candidateOption = `<option value="${id}">${name} - ${party}</option>`;
    candidatesSelect.append(candidateOption);
  },

  castVote: function () {
    var candidateId = $("#candidatesSelect").val();
    App.contracts.Election.deployed()
      .then(function (instance) {
        return instance.vote(candidateId, { from: App.account });
      })
      .then(function (result) {
        $("#content").hide();
        $("#loader").show();
        alert("Thanks for voting!");
      })
      .catch(function (error) {
        console.error(error);
      });
  },
  
  // DOM elements
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  loginBtn: document.getElementById('login-btn'),
  signupBtn: document.getElementById('signup-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  mainContent: document.getElementById('main-content'),
  loginSection: document.getElementById('login-section'),
  signupSection: document.getElementById('signup-section'),

  // Check if user is already authenticated
  initAuthentication: function () {
    if (localStorage.getItem('loggedIn')) {
      App.showMainContent();
    } else {
      App.showLoginSection();
    }

    // Event listeners
    App.loginForm.addEventListener('submit', App.handleLogin);
    App.signupForm.addEventListener('submit', App.handleSignup);
    App.logoutBtn.addEventListener('click', App.handleLogout);
  },

  handleLogin: function (e) {
    e.preventDefault();
    // Perform login authentication logic
    // Example: Authenticate user credentials with backend or blockchain
    // If login is successful, set the authentication flag in local storage
    localStorage.setItem('loggedIn', true);
    App.showMainContent();
  },

  handleSignup: function (e) {
    e.preventDefault();
    // Perform signup logic
    // Example: Create a new user account in backend or blockchain
    // If signup is successful, set the authentication flag in local storage
    localStorage.setItem('loggedIn', true);
    App.showMainContent();
  },

  handleLogout: function () {
    // Clear the authentication flag from local storage
    localStorage.removeItem('loggedIn');
    App.showLoginSection();
  },

  showLoginSection: function () {
    App.mainContent.style.display = 'none';
    App.loginSection.style.display = 'block';
    App.signupSection.style.display = 'none';
  },

  showSignupSection: function () {
    App.mainContent.style.display = 'none';
    App.loginSection.style.display = 'none';
    App.signupSection.style.display = 'block';
  },

  showMainContent: function () {
    App.mainContent.style.display = 'block';
    App.loginSection.style.display = 'none';
    App.signupSection.style.display = 'none';
  },
};

$(function () {
  $(window).load(function () {
    App.init();
    App.initAuthentication();
  });
});
