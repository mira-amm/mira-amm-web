import {generateFiles} from 'fumadocs-openapi'

void generateFiles({
    input: 'http://localhost:8000/api/openapi.json',
    output: '/content/docs',
    includeDescription: true,
});
