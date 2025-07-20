import {Injectable} from "@nestjs/common";
import {Provider} from "fuels";
import {ReadonlyMiraAmm} from "mira-dex-ts";
// import {NETWORK_URL} from "@/shared/lib/constants" // TODO: Investigate path resolution failure on `start` command, even though dev server and builds are fine

@Injectable()
export class ReadAmmService {
  private readonly readonlyMira: ReadonlyMiraAmm;

  constructor() {
    const NETWORK_URL: string = "https://mainnet.fuel.network/v1/graphql";
    const provider = new Provider(NETWORK_URL);
    this.readonlyMira = new ReadonlyMiraAmm(provider);
  }

  getId() {
    return this.readonlyMira.id();
  }

  getMetadata() {
    return this.readonlyMira.ammMetadata();
  }
}
