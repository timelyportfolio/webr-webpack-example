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

    // now for the highly experimental and probably problematic stuff
    //  try to install package from r-universe.dev
    const svg2 = await webR.evalRString(`
      install_runiverse <- function(packages, pkg_ver, author, lib = NULL) {
        # most of this code copied from webr install function
        # https://github.com/r-wasm/webr/blob/8c1c8038e4d238e91ec141537de11e114a01da2b/packages/webr/R/install.R
        if (is.null(lib)) {
          lib <- .libPaths()[[1]]
        }
        # only works for r-universe
      
        for (pkg in packages) {
          # once I figure out quotes in JS template literals with Webpack convert to use getRversion()
          ver <- "4.1"
          bin_suffix <- sprintf("bin/macosx/contrib/%s",ver)
          
          repo = sprintf("https://%s.r-universe.dev", author)
          
          path <- file.path(repo, bin_suffix, paste0(pkg, "_", pkg_ver, ".tgz"))
      
          tmp <- tempfile()
          message(paste("Downloading webR package:", pkg))
          utils::download.file(path, tmp, quiet = TRUE)
      
          utils::untar(
            tmp,
            exdir = lib,
            tar = "internal",
            extras = "--no-same-permissions"
          )
        }
        invisible(NULL)
      }
      
      install_runiverse(packages="basetheme",pkg_ver="0.1.2",author="karoliskoncevicius")
      library(svglite)
      s <- svglite::svgstring(standalone = FALSE)    
      library(basetheme)
      # example from basetheme
      # Set theme by list
      theme <- basetheme("clean")
      theme$rect.col <- "grey90"
      basetheme(theme)
      pairs(iris[,1:4], col=iris$Species)
      s()
    `)
    document.getElementById('plotcontainer-basetheme').innerHTML = svg;
    // resize the svg the old manual way
    document.querySelector('#plotcontainer-basetheme svg').setAttribute('width','100%');
    document.querySelector('#plotcontainer-basetheme svg').setAttribute('height', '100%');

  } finally {
    webR.destroy(val);
  }
})();
