import { PRACTITIONER_CATEGORY } from './../../practitioners/dto/category.dto';
export function mapPractitionerCategoryToString(
  category: PRACTITIONER_CATEGORY,
): string {
  switch (category) {
    case PRACTITIONER_CATEGORY.GeneralPractitioner:
      return 'General practitioner';
    case PRACTITIONER_CATEGORY.Gynecologist:
      return 'Gynecologist';
    case PRACTITIONER_CATEGORY.Physiotherapist:
      return 'Physiotherapist';
    case PRACTITIONER_CATEGORY.Psychologist:
      return 'Psychologist';
    case PRACTITIONER_CATEGORY.WellnessHub:
      return 'Wellness hub';
    case PRACTITIONER_CATEGORY.Biokineticist:
      return 'Biokineticist';
    case PRACTITIONER_CATEGORY.Dentist:
      return 'Dentist';
    default:
      return 'Practitioner category';
  }
}
