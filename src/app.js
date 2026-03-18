import { BrowserOAuthClient } from '@atproto/oauth-client-browser'
import { Agent } from '@atproto/api'
import confetti from 'canvas-confetti'

// --- State ---
let oauthClient = null
let agent = null
let lastActionTimestamp = 0
const COOLDOWN_PERIOD = 2000

// --- DOM references ---
const loginSection = document.getElementById('loginSection')
const actionSection = document.getElementById('actionSection')
const handleInput = document.getElementById('handle')
const signInButton = document.getElementById('signInButton')
const signOutButton = document.getElementById('signOutButton')
const displayHandle = document.getElementById('displayHandle')
const followStatus = document.getElementById('followStatus')
const followButton = document.getElementById('followButton')
const unfollowButton = document.getElementById('unfollowButton')
const followBenediktButton = document.getElementById('followBenediktButton')
const resultDiv = document.getElementById('result')

// --- Utility functions ---
function showError(message) {
  resultDiv.className = 'error'
  resultDiv.textContent = message
}

function showSuccess(message) {
  resultDiv.className = 'success'
  resultDiv.textContent = message
}

function clearResult() {
  resultDiv.className = ''
  resultDiv.textContent = ''
}

function setLoading(button, isLoading) {
  button.disabled = isLoading
  if (isLoading) {
    button.classList.add('loading')
  } else {
    button.classList.remove('loading')
  }
}

function checkCooldown() {
  const now = Date.now()
  if (now - lastActionTimestamp < COOLDOWN_PERIOD) {
    throw new Error('Please wait a moment before trying again')
  }
  lastActionTimestamp = now
}

function sanitizeHandle(handle) {
  return handle.startsWith('@') ? handle.slice(1) : handle
}

// --- UI State Management ---
function updateBenediktStatus(isFollowing) {
  if (isFollowing) {
    followBenediktButton.textContent = 'Following @benedikt.phd'
    followBenediktButton.disabled = true
    followBenediktButton.classList.add('already-following')
  } else {
    followBenediktButton.textContent = 'Follow @benedikt.phd'
    followBenediktButton.disabled = false
    followBenediktButton.classList.remove('already-following')
  }
}

function updateFollowStatus(isFollowing) {
  if (isFollowing) {
    const justFollowed = followStatus.classList.contains('not-following')
    followStatus.textContent = 'You are following yourself 🎉'
    followStatus.className = 'follow-status following'
    followButton.style.display = 'none'
    unfollowButton.style.display = 'block'
    if (justFollowed) {
      const end = Date.now() + 800
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval)
        confetti({
          particleCount: 15,
          startVelocity: 20,
          spread: 360,
          origin: {
            x: Math.random() * 0.4 + 0.3,
            y: Math.random() * 0.3 + 0.3,
          },
        })
      }, 150)
    }
  } else {
    followStatus.textContent = 'You are not following yourself'
    followStatus.className = 'follow-status not-following'
    followButton.style.display = 'block'
    unfollowButton.style.display = 'none'
  }
  clearResult()
}

const BENEDIKT_DID = 'did:plc:6dvollmohijzopc5qoi7z2rt'

async function checkFollowStatuses() {
  try {
    let cursor = undefined
    let foundSelf = false
    let foundBenedikt = false
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: agent.assertDid,
        collection: 'app.bsky.graph.follow',
        limit: 100,
        cursor,
      })
      for (const r of res.data.records) {
        if (r.value.subject === agent.assertDid) foundSelf = true
        if (r.value.subject === BENEDIKT_DID) foundBenedikt = true
      }
      cursor = res.data.cursor
    } while ((!foundSelf || !foundBenedikt) && cursor)
    updateFollowStatus(foundSelf)
    updateBenediktStatus(foundBenedikt)
  } catch {
    followStatus.textContent = ''
    followStatus.className = 'follow-status'
  }
}

async function refreshProfile() {
  // Use PDS endpoint for handle (works with transition:generic scope)
  try {
    const sessionInfo = await agent.com.atproto.server.getSession()
    displayHandle.textContent = '@' + sessionInfo.data.handle
  } catch {
    displayHandle.textContent = agent.assertDid
  }

  // Check self-follow by scanning follow records on the PDS
  await checkFollowStatuses()
}

function showLoggedIn() {
  loginSection.style.display = 'none'
  actionSection.style.display = 'block'
  clearResult()
  refreshProfile()
}

function showLoggedOut() {
  agent = null
  loginSection.style.display = 'block'
  actionSection.style.display = 'none'
  clearResult()
}

// --- Initialize OAuth client ---
async function init() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  oauthClient = new BrowserOAuthClient({
    clientMetadata: isLocalhost ? undefined : {
      client_id: 'https://follow-yourself.benedikt.phd/client-metadata.json',
      client_name: 'Follow Yourself on Bluesky',
      client_uri: 'https://follow-yourself.benedikt.phd',
      redirect_uris: ['https://follow-yourself.benedikt.phd/'],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'none',
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
    onDelete: () => {
      showLoggedOut()
      showError('Session expired. Please sign in again.')
    },
  })

  try {
    const result = await oauthClient.init()
    if (result) {
      const { session } = result
      agent = new Agent(session)
      showLoggedIn()
    } else {
      showLoggedOut()
    }
  } catch (err) {
    console.error('OAuth init failed:', err)
    showLoggedOut()
    showError('Authentication failed. Please try again.')
  }
}

// --- Event Handlers ---

signInButton.addEventListener('click', async () => {
  const handle = sanitizeHandle(handleInput.value.trim())
  if (!handle) {
    showError('Please enter your Bluesky handle')
    return
  }

  setLoading(signInButton, true)
  clearResult()

  try {
    await oauthClient.signIn(handle)
    // Browser redirects away — this never resolves
  } catch (err) {
    setLoading(signInButton, false)
    showError('Sign-in failed: ' + err.message)
  }
})

handleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    signInButton.click()
  }
})

signOutButton.addEventListener('click', () => {
  agent = null
  localStorage.removeItem('@@atproto/oauth-client-browser(sub)')
  indexedDB.deleteDatabase('@atproto-oauth-client')
  showLoggedOut()
})

followButton.addEventListener('click', async () => {
  clearResult()
  setLoading(followButton, true)

  try {
    checkCooldown()
    await agent.follow(agent.assertDid)
    checkFollowStatuses()
  } catch (err) {
    showError('Error: ' + err.message)
  } finally {
    setLoading(followButton, false)
  }
})

unfollowButton.addEventListener('click', async () => {
  clearResult()
  setLoading(unfollowButton, true)

  try {
    checkCooldown()
    const followResult = await agent.follow(agent.assertDid)
    await agent.deleteFollow(followResult.uri)
    checkFollowStatuses()
  } catch (err) {
    showError('Error: ' + err.message)
  } finally {
    setLoading(unfollowButton, false)
  }
})

followBenediktButton.addEventListener('click', async () => {
  clearResult()
  setLoading(followBenediktButton, true)

  try {
    checkCooldown()
    await agent.follow(BENEDIKT_DID)
    setLoading(followBenediktButton, false)
    updateBenediktStatus(true)
    showSuccess('Thanks :)')
    const end = Date.now() + 800
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval)
      confetti({
        particleCount: 15,
        startVelocity: 20,
        spread: 360,
        origin: {
          x: Math.random() * 0.4 + 0.3,
          y: Math.random() * 0.3 + 0.3,
        },
      })
    }, 150)
  } catch (err) {
    showError('Error: ' + err.message)
    setLoading(followBenediktButton, false)
  }
})

// --- Start ---
init()
