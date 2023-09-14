window.onload = function() {
  function get( evt ) {
    fetch( './'+evt.target.innerText )
      .then( res => res.text() )
      .then( txt => {
        // remove comments
        txt = txt.replaceAll(/\/\/.*|\/\*[^]*\*\//g, '')
        txt = txt.replace(/\n\s*\n/g, '\n\n');      
        document.querySelector('code').innerHTML = txt
        microlight.reset('code') 
      })
  }

  get({ target: { innerText:'main.js' } })

  document.querySelectorAll('button').forEach(btn=>btn.onclick=get)
}
