from setuptools import setup, find_packages

import os.path


def get_current_dir():
    return os.path.dirname(os.path.realpath(__file__))


__version__ = "0.0.1"

setup(name='lvscharts',
      version=__version__,
      description='LVS Charts API',
      url='',
      packages=find_packages(),
      )
