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
        # if (is.null(repos)) {
        #   repos <- getOption("webr_pkg_repos")
        # }
        # #info <- utils::available.packages(repos = repos, type = "source")
        # # try to get info from r-universe api
        # info <- sprintf('https://%s.r-universe.dev/%s/json', author, package)
        # do not handle dependencies for now
        # deps <- unlist(tools::package_dependencies(packages, info), use.names = FALSE)
        # deps <- unique(deps)
        # 
        # for (dep in deps) {
        #   if (length(find.package(dep, quiet = TRUE))) {
        #     next
        #   }
        #   install(dep, repos, lib)
        # }
      
        for (pkg in packages) {
          # # do not check for now to simplify the operation
          # if (length(find.package(pkg, quiet = TRUE))) {
          #   next
          # }
          # 
          # if (!pkg %in% info) {
          #   warning(cat("Requested package", pkg, "not found in webR binary repo.\n"))
          #   next
          # }
      
          ver <- as.character(getRversion())
          # need four backslashes in JS template for webR
          ver <- gsub('\\\\.[^.]+$', '', ver)
          
          bin_suffix <- sprintf('bin/macosx/contrib/%s',ver)
          
          # https://karoliskoncevicius.r-universe.dev/bin/macosx/contrib/4.1/basetheme_0.1.2.tgz
          repo = sprintf('https://%s.r-universe.dev', author)
          
          # repo <- info[pkg, "Repository"]
          # repo <- sub("src/contrib", bin_suffix, repo, fixed = TRUE)
          # repo <- sub("file:", "", repo, fixed = TRUE)
      
          #pkg_ver <- info[pkg, "Version"]
          path <- file.path(repo, bin_suffix, paste0(pkg, '_', pkg_ver, '.tgz'))
      
          tmp <- tempfile()
          message(paste('Downloading webR package:', pkg))
          utils::download.file(path, tmp, quiet = TRUE)
      
          utils::untar(
            tmp,
            exdir = lib,
            tar = 'internal',
            extras = '--no-same-permissions'
          )
        }
        invisible(NULL)
      }
      
      install_runiverse(packages='basetheme',pkg_ver='0.1.2',author='karoliskoncevicius')
    
      library(basetheme)
      # example from basetheme
      # Set theme by list
      theme <- basetheme("clean")
      theme$rect.col <- "grey90"
      basetheme(theme)
      pairs(iris[,1:4], col=iris$Species)
    `)
    document.getElementById('plotcontainer-basetheme').innerHTML = svg;
    // resize the svg the old manual way
    document.querySelector('#plotcontainer-basetheme svg').setAttribute('width','100%');
    document.querySelector('#plotcontainer-basetheme svg').setAttribute('height', '100%');

  } finally {
    webR.destroy(val);
  }
})();
