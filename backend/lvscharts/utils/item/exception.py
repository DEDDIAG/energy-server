from werkzeug.exceptions import NotFound, BadRequest


class ItemNotFoundException(NotFound):
    description = 'Item not found'

    def __init__(self, item):
        super(ItemNotFoundException, self).__init__(self.description + ": " + str(item))


class NotInitializedException(Exception):
    pass


class InvalidDateFormat(BadRequest):
    description = 'Date must be ISO8601'

    def __init__(self, date):
        super(InvalidDateFormat, self).__init__(self.description + ": " + date)


class AnnotationLabelNotFound(NotFound):
    description = 'Annotation label not found'

    def __init__(self, label_id):
        super(AnnotationLabelNotFound, self).__init__(self.description + ": " + label_id)


class AnnotationNotFound(NotFound):
    description = 'Annotation not found'

    def __init__(self, annotation_id):
        super(AnnotationNotFound, self).__init__(self.description + ": " + annotation_id)
