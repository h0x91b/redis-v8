<?php

/*
 * This file is part of the Predis package.
 *
 * (c) Daniele Alessandri <suppakilla@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Predis\Command;

/**
 * @link http://redis.io/commands/echo
 * @author Daniele Alessandri <suppakilla@gmail.com>
 */
class JS extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    public function getId()
    {
        return 'JS';
    }

	/**
     * {@inheritdoc}
     */
    public function parseResponse($data)
    {
        return json_decode($data,TRUE);
    }
}
