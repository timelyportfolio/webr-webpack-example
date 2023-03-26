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

// make webR available in window/global
window.webR = webR;

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
      query_runiverse <- function(package, rver = "4.1") {
        # to leverage r-universe we will need jsonlite
        #   but of course this comes at a cost to speed
        #   do not use httr to avoid another dependency
        webr::install("jsonlite")
        library(jsonlite)

        # find package
        pkg_summary <- jsonlite::fromJSON(paste0("https://r-universe.dev/stats/powersearch?limit=1&all=true&q=",package), simplifyVector = FALSE)[[1]]
        author <- pkg_summary[[1]]$maintainer$login
        package <- pkg_summary[[1]]$Package

        # get package details
        pkg_details <- jsonlite::fromJSON(
          paste0(
            "https://",
            author,
            ".r-universe.dev/",
            package,
            "/json"
          ),
          simplifyVector = FALSE
        )

        # mac binary information
        mac_binary <- Filter(function(binary){grepl(x=binary$r,pattern=paste0("^",rver)) && binary$os == "mac"},pkg_details$binaries)[[1]]

        list(
          author = author,
          version = mac_binary$version,
          needs_compilation = pkg_details$NeedsCompilation
        )
      }

      install_runiverse <- function(packages, lib = NULL) {
        # most of this code copied from webr install function
        # https://github.com/r-wasm/webr/blob/8c1c8038e4d238e91ec141537de11e114a01da2b/packages/webr/R/install.R

        if (is.null(lib)) {
          lib <- .libPaths()[[1]]
        }
        # only works for r-universe
      
        for (pkg in packages) {
          # ugly with strsplit instead of gsub but I gave up on more elegant solution
          ver <- as.character(getRversion())
          ver_split <- strsplit(ver, ".", fixed = TRUE)
          ver <- sprintf("%s.%s", ver_split[[1]][1], ver_split[[1]][2])

          pkg_info <- query_runiverse(package = pkg, rver = ver)
          author <- pkg_info$author
          pkg_ver <- pkg_info$version

          bin_suffix <- sprintf("bin/macosx/contrib/%s",ver)
          
          repo = sprintf("https://%s.r-universe.dev", author)
          
          path <- file.path(repo, bin_suffix, paste0(pkg, "_", pkg_ver, ".tgz"))
      
          tmp <- tempfile()
          message(paste("Installing webR package:", pkg, " from r-universe"))
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
      
      install_runiverse(packages="basetheme")
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
    document.getElementById('plotcontainer-basetheme').innerHTML = svg2;
    // resize the svg the old manual way
    document.querySelector('#plotcontainer-basetheme svg').setAttribute('width','100%');
    document.querySelector('#plotcontainer-basetheme svg').setAttribute('height', '100%');

  } finally {
    webR.destroy(val);
  }
})();
