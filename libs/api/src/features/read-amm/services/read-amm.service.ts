import { Injectable } from '@nestjs/common';
import { Provider } from 'fuels';
import { ReadonlyMiraAmm } from 'mira-dex-ts';
import {NETWORK_URL} from "@/shared/lib/constants"

@Injectable()
export class ReadAmmService {
  private readonly readonlyMira: ReadonlyMiraAmm;

  constructor() {
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
