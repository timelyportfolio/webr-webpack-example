import { WebR } from '@r-wasm/webr';

/*
 * By default, webR will download R wasm binaries from CDN.
 *
 * In this example webpack is configured to copy the R wasm binaries, provided
 * by the webr npm package, into the output directory `dist`.
 *
 * Here webR is configured, using the `baseUrl` option, to download this copy
 * of the wasm binaries served from the `dist` directory, rather than from CDN.
 */
const webR = new WebR({
    baseUrl: './',
    serviceWorkerUrl: './',
    repoUrl: 'https://repo.r-wasm.org/'
});

(async () => {
  await webR.init();
  document.getElementById('load').innerText = 'webR has loaded!';
  const val = await webR.evalR('rnorm(25,10,10)');
  try {
    const values = await val.toArray();
    document.getElementById('random').innerText = values.join(', ');
    await webR.installPackages(['svglite','xtable']);
    const svg = await webR.evalRString(`
      library(svglite)
      s <- svglite::svgstring(standalone = FALSE)
      plot(1:10)
      s()
    `)
    document.getElementById('plotcontainer').innerHTML = svg;
    // resize the svg the old manual way
    document.querySelector('#plotcontainer svg').setAttribute('width','100%');
    document.querySelector('#plotcontainer svg').setAttribute('height', '100%');
    const tbl = await webR.evalRString(`
      print(
        xtable::xtable(mtcars, auto = TRUE),
        type="html",
        method="compact",
        print.results=FALSE,
        html.table.attributes="border=0 style='width:100%;'"
      )
    `)
    document.getElementById('tablecontainer').innerHTML = tbl;

  } finally {
    webR.destroy(val);
  }
})();
