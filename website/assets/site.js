(() => {
  const RELEASES = 'https://github.com/navidu-sathsara/native-releases/releases'
  const API = 'https://api.github.com/repos/navidu-sathsara/native-releases/releases/latest'

  const menuButton = document.querySelector('[data-menu-toggle]')
  const mobileMenu = document.querySelector('[data-mobile-menu]')
  const closeMenu = () => {
    document.body.classList.remove('menu-open')
    menuButton?.setAttribute('aria-expanded', 'false')
  }

  menuButton?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open')
    document.body.classList.toggle('menu-open', open)
    menuButton.setAttribute('aria-expanded', String(open))
  })
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu))
  addEventListener('resize', () => {
    if (innerWidth > 820) closeMenu()
  })

  document.querySelectorAll('[data-faq]').forEach((item, index) => {
    const button = item.querySelector('button')
    if (!button) return
    if (index === 0 && innerWidth > 820) {
      item.classList.add('open')
      button.setAttribute('aria-expanded', 'true')
    }
    button.addEventListener('click', () => {
      const open = item.classList.toggle('open')
      button.setAttribute('aria-expanded', String(open))
    })
  })

  document.querySelectorAll('[data-footer-column]').forEach((column) => {
    column.querySelector('button')?.addEventListener('click', () => {
      column.classList.toggle('open')
    })
  })

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('visible')
        reveal.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  )
  document.querySelectorAll('.reveal').forEach((node) => reveal.observe(node))

  const patterns = {
    'windows-x64': /^Native-Setup-.+-x64\.exe$/i,
    'windows-arm64': /^Native-Setup-.+-arm64\.exe$/i,
    'linux-x64': /^Native-.+-x86_64\.AppImage$/i,
    'linux-arm64': /^Native-.+-arm64\.AppImage$/i,
    'linux-deb-x64': /^Native-.+-amd64\.deb$/i,
    'linux-deb-arm64': /^Native-.+-arm64\.deb$/i,
    'mac-x64': /^Native-.+-x64\.dmg$/i,
    'mac-arm64': /^Native-.+-arm64\.dmg$/i
  }

  const preferredAsset = () => {
    const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent
    const lower = platform.toLowerCase()
    if (lower.includes('mac')) return 'mac-arm64'
    if (lower.includes('linux')) return 'linux-x64'
    return 'windows-x64'
  }

  const primary = document.querySelector('[data-primary-download]')
  if (primary) primary.dataset.releaseAsset = preferredAsset()

  fetch(API, { headers: { accept: 'application/vnd.github+json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
      return response.json()
    })
    .then((release) => {
      const version = String(release.tag_name || '').replace(/^v/, '')
      const assets = Array.isArray(release.assets) ? release.assets : []
      document.querySelectorAll('[data-release-version]').forEach((node) => {
        if (version) node.textContent = version
      })
      document.querySelectorAll('[data-release-notes]').forEach((node) => {
        node.href = release.html_url || RELEASES
      })
      document.querySelectorAll('[data-release-asset]').forEach((node) => {
        const matcher = patterns[node.dataset.releaseAsset]
        const match = matcher && assets.find((asset) => matcher.test(asset.name))
        node.href = match?.browser_download_url || release.html_url || `${RELEASES}/latest`
      })
    })
    .catch(() => {
      document.querySelectorAll('[data-release-asset], [data-release-notes]').forEach((node) => {
        node.href = `${RELEASES}/latest`
      })
    })
})()
