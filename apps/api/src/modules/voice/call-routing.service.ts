import { Injectable } from "@nestjs/common";
import { normalizeE164 } from "./e164";
import { PhoneNumberRepository } from "./repositories/phone-number.repository";

@Injectable()
export class CallRoutingService {
  constructor(private readonly phoneNumbers: PhoneNumberRepository) {}

  async resolve(calledNumber: string) {
    return this.phoneNumbers.findRoutableByPhoneNumber(normalizeE164(calledNumber));
  }
}
