const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');

const manifest = {
  id: 'com.example.korean-drama-addon',
  version: '1.0.0',
  name: 'Korean Drama Addon',
  description: 'Streams Korean dramas and series',
  icon: 'URL_TO_ICON_IMAGE',
  catalogs: [],
  resources: ['catalog', 'stream'],
  types: ['series', 'movie'],
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async (args) => {
  // Fetch catalogs from Viki API
  const catalogs = await axios.get('https://api.viki.io/v4/containers.json');
  
  // Map the response to Stremio catalog schema
  const stremioCatalogs = catalogs.data.response.map((item) => ({
    id: item.id,
    type: item.kind, // 'series' or 'movie'
    name: item.name,
    poster: item.thumb,
    genres: item.categories,
  }));
  
  return Promise.resolve({ metas: stremioCatalogs });
});

builder.defineStreamHandler(async (args) => {
  // Fetch the stream URL for the selected item from Viki API
  const streamUrl = await axios.get(`https://api.viki.io/v4/videos/${args.id}.json`, {
    params: {
      with_streams: true,
    },
  });
  
  // Extract the stream URL from the response
  const streamData = streamUrl.data.response;
  const streams = streamData.streams.map((stream) => ({
    title: stream.title,
    url: stream.url,
  }));

  // Provide the streams to Stremio in response
  return Promise.resolve({ streams });
});

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });